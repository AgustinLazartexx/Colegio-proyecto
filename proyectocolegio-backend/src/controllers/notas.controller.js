// controllers/notas.controller.js
import NotaTrimestral from "../models/notaTrimestral.model.js";
import AuditoriaNota from "../models/auditoriaNota.model.js"; // <-- Importamos el nuevo modelo
import Clase from "../models/Clases.js";
import mongoose from "mongoose";

// Helper de seguridad (sin cambios)
const assertProfesorDeLaMateria = async (materiaId, profesorId) => {
  const clase = await Clase.findOne({ materia: materiaId, profesor: profesorId });
  if (!clase) {
    const e = new Error("No autorizado para esta materia");
    e.status = 403;
    throw e;
  }
};

/**
 * Endpoint: POST /api/notas/guardar-una
 * Lógica de roles:
 * - PROFESOR: Solo puede guardar si la nota no existe.
 * - ADMIN: Puede guardar y sobrescribir (auditado).
 */
export const guardarNota = async (req, res) => {
  try {
    const { materiaId, alumnoId, trimestre, tipoNota, nota } = req.body;
    const usuario = req.user; // { id: "...", rol: "..." }

    if (!materiaId || !alumnoId || !trimestre || !tipoNota || nota === undefined) {
      return res.status(400).json({ msg: "Datos incompletos" });
    }

    // 1. Verificar permisos (solo si es profesor, el admin no necesita estar en la clase)
    if (usuario.rol === 'profesor') {
      await assertProfesorDeLaMateria(materiaId, usuario.id);
    }

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
    const notaNueva = nota === "" ? null : Number(nota); // Convertir a número o null

    // Verificar si la nota ya tiene un valor
    if (valorActual !== null && valorActual !== undefined && valorActual !== "") {
      
      // Si ya tiene valor, SÓLO el admin puede cambiarlo
      if (usuario.rol === 'profesor') {
        return res.status(403).json({ msg: "Esta nota ya fue guardada y no se puede modificar." });
      }

      // Si es ADMIN y el valor es diferente, auditamos el cambio
      if (usuario.rol === 'admin' && valorActual !== notaNueva) {
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
        await auditoria.save(); // Guardar el registro de auditoría
      }
    }

    // 4. Asignar la nueva nota y guardar
    doc[tipoNota] = notaNueva;
    doc.actualizadoPor = usuario.id;
    
    await doc.save(); // El pre-save hook calculará los promedios

    res.json({ msg: "Nota guardada", nota: doc });

  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ msg: err.message || "Error al guardar la nota" });
  }
};

/**
 * Endpoint: GET /api/notas/auditoria
 * Nuevo endpoint para que el Admin vea los cambios
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
      .sort({ createdAt: -1 }); // Los cambios más nuevos primero

    res.json(logs);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al obtener auditoría" });
  }
};

// ... (getNotasPorMateriaTrimestre y misNotasAlumno se mantienen igual) ...
// (Asegúrate de que getNotasPorMateriaTrimestre permita el rol "admin" también)
export const getNotasPorMateriaTrimestre = async (req, res) => {
  try {
    const { id } = req.params; // materiaId
    const { trimestre } = req.query; // ?trimestre=1
    
    if (!trimestre) {
      return res.status(400).json({ msg: "Debe especificar un trimestre." });
    }
    
    // El Admin o el Profesor pueden ver esto
    if (req.user.rol === 'profesor') {
      await assertProfesorDeLaMateria(id, req.user.id);
    }
    // (Si es admin, se salta el check y puede ver todo)

    const notasDocs = await NotaTrimestral.find({ 
      materia: id, 
      trimestre: Number(trimestre) 
    });

    // Formatear como objeto { [alumnoId]: { ...notas } }
    const notasObjeto = notasDocs.reduce((acc, doc) => {
      acc[doc.alumno] = {
        // ... (el resto de los campos de nota)
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

  } catch (err)
 {
    console.error(err);
    res.status(err.status || 500).json({ msg: err.message || "Error al obtener las notas" });
  }
};

export const misNotasAlumno = async (req, res) => {
  // ... (sin cambios)
};