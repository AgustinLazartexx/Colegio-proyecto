// src/controllers/notas.controller.js
import NotaTrimestral from "../models/notaTrimestral.model.js";
import AuditoriaNota from "../models/auditoriaNota.model.js";
import Materia from "../models/materia.model.js"; // Asegúrate que la ruta sea correcta
import mongoose from "mongoose";



// --- HELPER DE SEGURIDAD CON LOGS DETALLADOS ---
const assertProfesorDeLaMateria = async (materiaId, usuario) => {
  
  if (!usuario || !usuario.id) {
    console.error("ERROR: El objeto 'usuario' del token NO tiene 'id'. Verifica checkAuth.");
    const e = new Error("Error interno de autenticación");
    e.status = 500;
    throw e;
  }

  if (usuario.rol === 'admin') {
    console.log("Rol es Admin. Permiso concedido automáticamente."); // Log 4a
    return;
  }

  
  // Usamos .lean() para obtener un objeto JS simple, más rápido si solo leemos
  const materia = await Materia.findById(materiaId).select('profesor').lean();

  if (!materia) {
    
    const e = new Error("Materia no encontrada");
    e.status = 404;
    throw e;
  }


  if (!materia.profesor) {
      console.error("ERROR: La materia encontrada NO tiene un profesor asignado.");
       const e = new Error("Error de configuración: Materia sin profesor asignado.");
       e.status = 500;
       throw e;
  }

  const profesorEnMateria = materia.profesor.toString();
  const profesorEnToken = usuario.id.toString();

  

  if (profesorEnMateria !== profesorEnToken) {
    
    const e = new Error("No autorizado para esta materia");
    e.status = 403;
    throw e;
  }

  
};

/**
 * Endpoint: POST /api/notas/guardar-una
 */
export const guardarNota = async (req, res) => {
  try {
    const { materiaId, alumnoId, trimestre, tipoNota, nota } = req.body;
    const usuario = req.user; // Usamos req.user consistentemente

    if (!materiaId || !alumnoId || !trimestre || !tipoNota || nota === undefined) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    // 1. Verificar permisos
    await assertProfesorDeLaMateria(materiaId, usuario);

    // 2. Buscar o crear el documento de notas
    let doc = await NotaTrimestral.findOne({
      materia: materiaId,
      alumno: alumnoId,
      trimestre: trimestre
    });

    if (!doc) {
      doc = new NotaTrimestral({
        materia: materiaId,
        alumno: alumnoId,
        trimestre: trimestre,
        actualizadoPor: usuario.id,
      });
    }

    // 3. REGLA DE ROLES Y INMUTABILIDAD
    const valorActual = doc[tipoNota];
    // Convertir "" a null, y otros valores a Number
    const notaNueva = nota === "" ? null : Number(nota);

    // Solo proceder si el valor realmente cambió
    if (String(valorActual) !== String(notaNueva)) { // Comparar como strings
        if (valorActual !== null && valorActual !== undefined && String(valorActual) !== "") {
            if (usuario.rol === 'profesor') {
                return res.status(403).json({ msg: "Esta nota ya fue guardada y no se puede modificar." });
            }

            if (usuario.rol === 'admin') {
                const auditoria = new AuditoriaNota({
                  notaOriginalId: doc._id,
                  materia: materiaId,
                  alumno: alumnoId,
                  trimestre: trimestre,
                  campoModificado: tipoNota,
                  valorAnterior: String(valorActual),
                  valorNuevo: String(notaNueva),
                  modificadoPor: usuario.id
                });
                await auditoria.save();
            }
        }

        // 4. Asignar la nueva nota y guardar
        doc[tipoNota] = notaNueva;
        doc.actualizadoPor = usuario.id;

        await doc.save();
    } else {
        // Si el valor no cambió, no hacemos nada, pero devolvemos el doc actual
        console.log("Nota no modificada (valor igual al anterior).");
    }

    res.json({ msg: "Operación completada", nota: doc });

  } catch (err) {
    console.error("Error en guardarNota:", err); // Log de error específico
    res.status(err.status || 500).json({ msg: err.message || "Error al guardar la nota" });
  }
};

/**
 * Endpoint: GET /api/notas/materia/:id?trimestre=N
 */
export const getNotasPorMateriaTrimestre = async (req, res) => {
  // --- LOG DE ENTRADA A LA FUNCIÓN ---
  console.log(`\n>>> Entrando a getNotasPorMateriaTrimestre (Trimestre: ${req.query.trimestre})`); 
  // --- FIN LOG ---

  try {
    const { id } = req.params; // materiaId
    const { trimestre } = req.query;
    const usuario = req.user; // Usamos req.user

    if (!trimestre) {
      return res.status(400).json({ msg: "Debe especificar un trimestre." });
    }

    // 1. Verificar permisos
    await assertProfesorDeLaMateria(id, usuario);

    // 2. Buscar todas las notas de esa materia y trimestre
    const notasDocs = await NotaTrimestral.find({
      materia: id,
      trimestre: Number(trimestre)
    });

    // 3. Formatear como objeto { [alumnoId]: { ...notas } }
    const notasObjeto = notasDocs.reduce((acc, doc) => {
      acc[doc.alumno] = {
        _id: doc._id, // Incluir el ID del documento de nota puede ser útil
        orientadora: doc.orientadora,
        proceso: doc.proceso,
        integradora: doc.integradora,
        recuperacion: doc.recuperacion,
        promedioPonderado: doc.promedioPonderado,
        notaFinalTrimestre: doc.notaFinalTrimestre,
      };
      return acc;
    }, {});

    res.json(notasObjeto);

  } catch (err) {
    console.error("Error en getNotasPorMateriaTrimestre:", err); // Log de error específico
    res.status(err.status || 500).json({ msg: err.message || "Error al obtener las notas" });
  }
};

/**
 * Endpoint: GET /api/notas/auditoria
 */
export const getAuditoriaNotas = async (req, res) => {
  try {
    const { materiaId, trimestre } = req.query;

    const query = {};
    if (materiaId) query.materia = materiaId;
    if (trimestre) query.trimestre = trimestre;

    const logs = await AuditoriaNota.find(query)
      .populate("modificadoPor", "nombre")
      .populate("alumno", "nombre")
      .sort({ createdAt: -1 });

    res.json(logs);

  } catch (err) {
    console.error("Error en getAuditoriaNotas:", err); // Log de error específico
    res.status(500).json({ msg: "Error al obtener auditoría" });
  }
};

/**
 * Endpoint: GET /api/notas/mias
 */
export const misNotasAlumno = async (req, res) => {
  try {
    const data = await NotaTrimestral.find({ alumno: req.user.id }) // Usamos req.user.id
      .populate("materia", "nombre")
      .sort({ materia: 1, trimestre: 1 });

    res.json({ total: data.length, notas: data });
  } catch (err) {
    console.error("Error en misNotasAlumno:", err); // Log de error específico
    res.status(500).json({ msg: "Error al obtener notas" });
  }
};