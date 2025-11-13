import Asistencia from "../models/asistencia.model.js";
import Clase from "../models/Clases.js";
// import User from "../models/user.model.js"; // No se usa aquí
import mongoose from "mongoose";

// --- Helpers ---
const handleNotFoundError = (res, type) => res.status(404).json({ msg: `${type} no encontrada` });
const handleInvalidIdError = (res, type, id) => res.status(400).json({ msg: `ID de ${type} inválido: ${id}` });

/**
 * Registra o actualiza múltiples asistencias.
 */
export const registrarAsistencias = async (req, res) => {
  console.log("LOG: INICIANDO registrarAsistencias...");
  const { claseId, fecha, asistencias } = req.body;
  console.log("LOG: Payload recibido:", { claseId, fecha, asistencias_count: asistencias?.length });

  // 1. Validaciones
  if (!claseId || !fecha || !asistencias || !Array.isArray(asistencias)) {
    console.error("LOG ERROR: Faltan datos requeridos.");
    return res.status(400).json({ msg: "Faltan datos: claseId, fecha y array de asistencias." });
  }
  if (!mongoose.Types.ObjectId.isValid(claseId)) {
    console.error("LOG ERROR: Clase ID inválido:", claseId);
    return handleInvalidIdError(res, "clase", claseId);
  }
  console.log("LOG: Datos básicos validados.");

  try {
    // 2. Verificar que la clase exista
    console.log("LOG: Buscando clase...");
    const claseExiste = await Clase.findById(claseId);
    if (!claseExiste) {
      console.error("LOG ERROR: Clase no encontrada en DB:", claseId);
      return handleNotFoundError(res, "Clase");
    }
    console.log("LOG: Clase encontrada:", claseExiste._id);

    // 3. Normalizar la fecha a UTC
    const fechaBusqueda = new Date(fecha);
    fechaBusqueda.setUTCHours(0, 0, 0, 0);
    console.log("LOG: Fecha normalizada a UTC:", fechaBusqueda.toISOString());

    // 4. Preparar operaciones 'bulkWrite'
    const bulkOps = asistencias.map(asistencia => {
      const { alumno, estado } = asistencia;

      if (!mongoose.Types.ObjectId.isValid(alumno)) {
        console.warn(`LOG WARN: ID de alumno inválido omitido: ${alumno}`);
        return null;
      }
      if (!['presente', 'ausente', 'tarde', 'justificado'].includes(estado)) {
         console.warn(`LOG WARN: Estado de asistencia inválido omitido: ${estado}`);
         return null;
      }

      return {
        updateOne: {
          filter: {
            clase: claseId,
            alumno: alumno,
            fecha: fechaBusqueda
          },
          update: {
            $set: {
              estado: estado,
              clase: claseId,
              alumno: alumno,
              fecha: fechaBusqueda
            }
          },
          upsert: true
        }
      };
    }).filter(op => op !== null); 

    console.log(`LOG: Preparadas ${bulkOps.length} operaciones bulk.`);

    // 5. Ejecutar
    if (bulkOps.length > 0) {
      console.log("LOG: Ejecutando bulkWrite...");
      await Asistencia.bulkWrite(bulkOps);
      console.log("LOG: bulkWrite completado.");
    } else {
      console.warn("LOG WARN: No hay operaciones válidas para ejecutar.");
      return res.status(400).json({ msg: "No se proporcionaron asistencias válidas." });
    }

    res.status(201).json({ msg: "Asistencias guardadas/actualizadas correctamente." });

  } catch (error) {
    console.error("=== ERROR AL REGISTRAR ASISTENCIAS ===", error);
    if (error.code === 11000) {
       return res.status(400).json({ msg: "Error de duplicado: La asistencia para uno o más alumnos en esta fecha ya existe." });
    }
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};


/**
 * Obtiene las asistencias para una clase y fecha específicas.
 */
export const obtenerAsistenciasPorClaseYFecha = async (req, res) => {
  console.log("LOG: INICIANDO obtenerAsistenciasPorClaseYFecha...");
  const { claseId, fecha } = req.query;
  console.log("LOG: Query params recibidos:", { claseId, fecha });

  if (!claseId || !fecha) {
    console.error("LOG ERROR: Faltan query params.");
    return res.status(400).json({ msg: "Se requieren claseId y fecha." });
  }
  if (!mongoose.Types.ObjectId.isValid(claseId)) {
     console.error("LOG ERROR: Clase ID inválido:", claseId);
    return handleInvalidIdError(res, "clase", claseId);
  }

  try {
    const fechaBusqueda = new Date(fecha);
    fechaBusqueda.setUTCHours(0, 0, 0, 0);
    console.log("LOG: Buscando asistencias para clase:", claseId, "en fecha:", fechaBusqueda.toISOString());

    const asistencias = await Asistencia.find({
      clase: claseId,
      fecha: fechaBusqueda
    });
    console.log(`LOG: Se encontraron ${asistencias.length} registros.`);

    const asistenciasMap = {};
    asistencias.forEach(a => {
      asistenciasMap[a.alumno] = a.estado;
    });

    res.json(asistenciasMap);

  } catch (error) {
    console.error("=== ERROR AL OBTENER ASISTENCIAS ===", error);
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};


/**
 * Obtiene el historial de asistencias para un alumno.
 */
export const obtenerAsistenciasPorAlumno = async (req, res) => {
  console.log("LOG: INICIANDO obtenerAsistenciasPorAlumno...");
  try {
    let alumnoId;

    if (req.user.rol === 'admin' && req.params.alumnoId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.alumnoId)) {
         return handleInvalidIdError(res, "alumno", req.params.alumnoId);
      }
      alumnoId = req.params.alumnoId;
      console.log("LOG: Buscando (Admin) para alumnoId:", alumnoId);
    } else {
      alumnoId = req.user.id;
      console.log("LOG: Buscando (Alumno) para su propio Id:", alumnoId);
    }
    
    const { materiaId } = req.query;
    const filtro = { alumno: alumnoId };

    if (materiaId) {
       console.log("LOG: Filtrando por materiaId:", materiaId);
       if (!mongoose.Types.ObjectId.isValid(materiaId)) {
           return handleInvalidIdError(res, "materia", materiaId);
       }
       const clases = await Clase.find({ materia: materiaId }).select('_id');
       const claseIds = clases.map(c => c._id);
       filtro.clase = { $in: claseIds };
    }

    console.log("LOG: Filtro final de búsqueda:", filtro);
    const asistencias = await Asistencia.find(filtro)
      .populate({
        path: 'clase',
        select: 'diaSemana horaInicio',
        populate: {
          path: 'materia',
          select: 'nombre'
        }
      })
      .sort({ fecha: -1 });

    console.log(`LOG: Encontradas ${asistencias.length} asistencias para el alumno.`);
    res.json(asistencias);

  } catch (error) {
    console.error("=== ERROR AL OBTENER ASISTENCIAS ALUMNO ===", error);
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};