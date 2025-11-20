// src/controllers/notas.controller.js
import NotaTrimestral from "../models/notaTrimestral.model.js";
import AuditoriaNota from "../models/auditoriaNota.model.js";
import Materia from "../models/materia.model.js";

// --- HELPER DE SEGURIDAD ---
const assertProfesorDeLaMateria = async (materiaId, usuario) => {
  if (!usuario || !usuario.id) {
    const e = new Error("Error interno de autenticación");
    e.status = 500;
    throw e;
  }

  if (usuario.rol === 'admin') return; // Admin pase libre

  const materia = await Materia.findById(materiaId).select('profesor').lean();
  if (!materia) {
    const e = new Error("Materia no encontrada");
    e.status = 404;
    throw e;
  }

  if (!materia.profesor || materia.profesor.toString() !== usuario.id.toString()) {
    const e = new Error("No autorizado para esta materia");
    e.status = 403;
    throw e;
  }
};

/**
 * Endpoint: POST /api/notas/guardar-una
 * LOGICA CORREGIDA:
 * 1. El profesor puede editar siempre, EXCEPTO si isBloqueada es true.
 * 2. El admin siempre puede editar (y genera auditoría).
 */
export const guardarNota = async (req, res) => {
  try {
    const { materiaId, alumnoId, trimestre, tipoNota, nota } = req.body;
    const usuario = req.user;

    // Validar campos permitidos para evitar inyección de datos en otros campos
    const camposPermitidos = ["orientadora", "proceso", "integradora", "recuperacion"];
    if (!camposPermitidos.includes(tipoNota)) {
      return res.status(400).json({ msg: "Tipo de nota no válido" });
    }

    if (!materiaId || !alumnoId || !trimestre || nota === undefined) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    // 1. Verificar permisos (Profesor de la materia o Admin)
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

    // 3. VERIFICACIÓN DE BLOQUEO (Admin vs Profesor)
    // Si el trimestre está bloqueado/cerrado y el usuario NO es admin, rechazar.
    if (doc.isBloqueada && usuario.rol !== 'admin') {
      return res.status(403).json({ 
        msg: "El trimestre está cerrado y aprobado por administración. No se pueden modificar las notas." 
      });
    }

    // 4. LÓGICA DE AUDITORÍA Y CAMBIO
    const valorActual = doc[tipoNota];
    const notaNueva = nota === "" ? null : Number(nota);

    // Solo actuamos si el valor es diferente
    if (String(valorActual) !== String(notaNueva)) {
        
        // Si es ADMIN modificando una nota existente, generamos auditoría
        if (usuario.rol === 'admin' && valorActual !== null && valorActual !== undefined) {
            try {
                await AuditoriaNota.create({
                  notaOriginalId: doc._id,
                  materia: materiaId,
                  alumno: alumnoId,
                  trimestre: trimestre,
                  campoModificado: tipoNota,
                  valorAnterior: String(valorActual),
                  valorNuevo: String(notaNueva),
                  modificadoPor: usuario.id
                });
            } catch (auditErr) {
                console.error("Error guardando auditoría:", auditErr);
                // No detenemos el flujo, pero logueamos el error
            }
        }

        // Aplicamos el cambio
        doc[tipoNota] = notaNueva;
        doc.actualizadoPor = usuario.id;

        // Si el admin toca la nota, podríamos querer desbloquear o mantener aprobado,
        // por seguridad, si se edita una nota, se podría quitar la aprobación:
        // doc.isAprobadaAdmin = false; // Descomentar si quieres que requiera re-aprobación

        await doc.save();
        return res.json({ msg: "Nota actualizada correctamente", nota: doc });
    } 
    
    // Si no hubo cambios
    res.json({ msg: "Sin cambios", nota: doc });

  } catch (err) {
    console.error("Error en guardarNota:", err);
    res.status(err.status || 500).json({ msg: err.message || "Error al guardar la nota" });
  }
};

/**
 * Endpoint: POST /api/notas/cambiar-estado
 * NUEVO: Permite al ADMIN aprobar o bloquear el trimestre de un alumno.
 */
export const cambiarEstadoTrimestre = async (req, res) => {
    try {
        const { notaId, isAprobadaAdmin, isBloqueada, observacion } = req.body;
        const usuario = req.user;

        // Solo Admins pueden hacer esto
        if (usuario.rol !== 'admin') {
            return res.status(403).json({ msg: "Acceso denegado. Requiere rol Administrador." });
        }

        const doc = await NotaTrimestral.findById(notaId);
        if (!doc) {
            return res.status(404).json({ msg: "Documento de notas no encontrado" });
        }

        // Actualizamos campos si vienen en el body
        if (isAprobadaAdmin !== undefined) doc.isAprobadaAdmin = isAprobadaAdmin;
        if (isBloqueada !== undefined) doc.isBloqueada = isBloqueada;
        if (observacion !== undefined) doc.observacion = observacion;
        
        doc.actualizadoPor = usuario.id;
        
        await doc.save();

        res.json({ msg: "Estado del trimestre actualizado", doc });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al cambiar estado" });
    }
};

// ... (Mantén getNotasPorMateriaTrimestre, getAuditoriaNotas, misNotasAlumno igual que antes)

export const getNotasPorMateriaTrimestre = async (req, res) => {
  try {
    const { id } = req.params; // materiaId
    const { trimestre } = req.query;
    const usuario = req.user;

    if (!trimestre) return res.status(400).json({ msg: "Debe especificar un trimestre." });

    await assertProfesorDeLaMateria(id, usuario);

    const notasDocs = await NotaTrimestral.find({ materia: id, trimestre: Number(trimestre) });

    const notasObjeto = notasDocs.reduce((acc, doc) => {
      acc[doc.alumno] = {
        _id: doc._id,
        orientadora: doc.orientadora,
        proceso: doc.proceso,
        integradora: doc.integradora,
        recuperacion: doc.recuperacion,
        promedioPonderado: doc.promedioPonderado,
        notaFinalTrimestre: doc.notaFinalTrimestre,
        // Enviamos estado al front para que el profesor vea si está bloqueado
        isAprobadaAdmin: doc.isAprobadaAdmin, 
        isBloqueada: doc.isBloqueada,
        observacion: doc.observacion
      };
      return acc;
    }, {});

    res.json(notasObjeto);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
};

// ... el resto de funciones (getAuditoriaNotas, misNotasAlumno) se mantienen igual.
export const getAuditoriaNotas = async (req, res) => {
    try {
      const { materiaId, trimestre } = req.query;
      const query = {};
      if (materiaId) query.materia = materiaId;
      if (trimestre) query.trimestre = trimestre;
  
      const logs = await AuditoriaNota.find(query)
        .populate("modificadoPor", "nombre")
        .populate("alumno", "nombre") // Asumiendo que tienes referencia a Alumno en el modelo Auditoria
        .sort({ createdAt: -1 });
  
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error al obtener auditoría" });
    }
  };

  export const misNotasAlumno = async (req, res) => {
    try {
      const data = await NotaTrimestral.find({ alumno: req.user.id })
        .populate("materia", "nombre")
        .sort({ materia: 1, trimestre: 1 });
  
      res.json({ total: data.length, notas: data });
    } catch (err) {
      res.status(500).json({ msg: "Error al obtener notas" });
    }
  };