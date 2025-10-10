// controllers/asistencia.controller.js

import Asistencia from "../models/asistencia.model.js";
import Materia from "../models/materia.model.js"; // Asegúrate de importar el modelo Materia
import mongoose from "mongoose";

// Helper: valida que el usuario (profesor) sea dueño de la materia
const assertProfesorDeLaMateria = async (materiaId, profesorId) => {
  const materia = await Materia.findById(materiaId).select("profesor");
  if (!materia) throw new Error("Materia no encontrada");
  if (String(materia.profesor) !== String(profesorId)) {
    const e = new Error("No autorizado para esta materia");
    e.status = 403;
    throw e;
  }
};

// POST /api/asistencias/tomar  (profesor)
// body: { materia: materiaId, fecha?, asistencias: [{ alumno, estado }] }
export const tomarAsistenciaLote = async (req, res) => {
  try {
    // ----- LÍNEA CORREGIDA -----
    // Cambiamos "clase: materiaId" por "materia: materiaId" para que coincida con el frontend
    const { materia: materiaId, fecha, asistencias } = req.body;

    // Validaciones mejoradas
    if (!materiaId || !mongoose.Types.ObjectId.isValid(materiaId)) {
      return res.status(400).json({ msg: "ID de materia inválido" });
    }

    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return res.status(400).json({ msg: "Asistencias debe ser un array no vacío" });
    }

    // Validar que todos los elementos del array tengan la estructura correcta
    for (const asist of asistencias) {
      if (!asist.alumno || !mongoose.Types.ObjectId.isValid(asist.alumno)) {
        return res.status(400).json({ msg: `ID de alumno inválido: ${asist.alumno}` });
      }
      if (!asist.estado || !["presente", "ausente", "tarde", "justificado"].includes(asist.estado)) {
        return res.status(400).json({ msg: `Estado inválido: ${asist.estado}` });
      }
    }

    // Verificar que el profesor sea dueño de la materia
    await assertProfesorDeLaMateria(materiaId, req.user.id);

    const fechaNormalizada = fecha ? new Date(fecha) : new Date();
    fechaNormalizada.setHours(0, 0, 0, 0);

    const ops = asistencias.map(a => ({
      updateOne: {
        filter: {
          materia: new mongoose.Types.ObjectId(materiaId),
          alumno: new mongoose.Types.ObjectId(a.alumno),
          fecha: fechaNormalizada
        },
        update: {
          $set: {
            materia: new mongoose.Types.ObjectId(materiaId),
            alumno: new mongoose.Types.ObjectId(a.alumno),
            fecha: fechaNormalizada,
            estado: a.estado,
            cargadoPor: new mongoose.Types.ObjectId(req.user.id)
          }
        },
        upsert: true
      }
    }));

    const result = await Asistencia.bulkWrite(ops);
    res.status(200).json({
      msg: "Asistencia registrada",
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
      }
    });
  } catch (err) {
    console.error("Error en tomarAsistenciaLote:", err);
    res.status(err.status || 500).json({ msg: err.message || "Error al tomar asistencia" });
  }
};

// ... (el resto de tus funciones no necesitan cambios para este error)

// Función simplificada para cargar asistencias individuales
export const cargarAsistenciaSimple = async (req, res) => {
  try {
    const { clase: materiaId, alumno, estado, fecha } = req.body; // clase contiene materiaId
    
    // Validaciones
    if (!materiaId || !mongoose.Types.ObjectId.isValid(materiaId)) {
      return res.status(400).json({ msg: "ID de materia requerido y válido" });
    }
    if (!alumno || !mongoose.Types.ObjectId.isValid(alumno)) {
      return res.status(400).json({ msg: "ID de alumno requerido y válido" });
    }
    if (!estado || !["presente", "ausente", "tarde", "justificado"].includes(estado)) {
      return res.status(400).json({ msg: "Estado inválido" });
    }

    await assertProfesorDeLaMateria(materiaId, req.user.id);

    const fechaNormalizada = fecha ? new Date(fecha) : new Date();
    fechaNormalizada.setHours(0, 0, 0, 0);

    // Buscar si ya existe
    let asistencia = await Asistencia.findOne({
      materia: materiaId, // Cambiado de clase a materia
      alumno: alumno,
      fecha: fechaNormalizada
    });

    if (asistencia) {
      // Actualizar existente
      asistencia.estado = estado;
      asistencia.cargadoPor = req.user.id;
      await asistencia.save();
    } else {
      // Crear nuevo
      asistencia = new Asistencia({
        materia: materiaId, // Cambiado de clase a materia
        alumno: alumno,
        fecha: fechaNormalizada,
        estado: estado,
        cargadoPor: req.user.id
      });
      await asistencia.save();
    }

    res.status(201).json({ 
      msg: "Asistencia guardada correctamente", 
      asistencia 
    });
  } catch (err) {
    console.error("Error en cargarAsistenciaSimple:", err);
    res.status(err.status || 500).json({ msg: err.message || "Error al cargar asistencia" });
  }
};

// GET /api/asistencias  (admin)  filtros: materia, alumno, desde, hasta
export const listarAsistencias = async (req, res) => {
  try {
    const { materia, alumno, desde, hasta } = req.query;

    const query = {};
    if (materia && mongoose.Types.ObjectId.isValid(materia)) {
      query.materia = materia; // Cambiado de clase a materia
    }
    if (alumno && mongoose.Types.ObjectId.isValid(alumno)) {
      query.alumno = alumno;
    }
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) {
        const h = new Date(hasta);
        h.setHours(23, 59, 59, 999);
        query.fecha.$lte = h;
      }
    }

    // Si es profesor, limitar a sus materias
    if (req.user.rol === "profesor") {
      const materiasDoc = await Materia.find({ profesor: req.user.id }).select("_id");
      const ids = materiasDoc.map(m => m._id);
      if (query.materia) {
        // Verificar que la materia solicitada esté en sus materias
        if (!ids.some(id => String(id) === String(query.materia))) {
          return res.status(403).json({ msg: "No autorizado para ver esta materia" });
        }
      } else {
        query.materia = { $in: ids };
      }
    }

    const data = await Asistencia.find(query)
      .populate("materia", "nombre codigo profesor") // Cambiado de clase a materia
      .populate("alumno", "nombre email")
      .populate("cargadoPor", "nombre")
      .sort({ fecha: -1 });

    res.json({ total: data.length, asistencias: data });
  } catch (err) {
    console.error("Error en listarAsistencias:", err);
    res.status(500).json({ msg: "Error al listar asistencias" });
  }
};

// GET /api/asistencias/mias  (alumno)
export const misAsistenciasAlumno = async (req, res) => {
  try {
    const data = await Asistencia.find({ alumno: req.user.id })
      .populate("materia", "nombre codigo profesor") // Cambiado de clase a materia
      .sort({ fecha: -1 });

    res.json({ total: data.length, asistencias: data });
  } catch (err) {
    console.error("Error en misAsistenciasAlumno:", err);
    res.status(500).json({ msg: "Error al obtener asistencias" });
  }
};

// PUT /api/asistencias/:id  (profesor de esa materia o admin)
export const actualizarAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID inválido" });
    }
    
    if (estado && !["presente", "ausente", "tarde", "justificado"].includes(estado)) {
      return res.status(400).json({ msg: "Estado inválido" });
    }

    const doc = await Asistencia.findById(id);
    if (!doc) return res.status(404).json({ msg: "Registro no encontrado" });

    if (req.user.rol === "profesor") {
      await assertProfesorDeLaMateria(doc.materia, req.user.id); // Cambiado de clase a materia
    }

    doc.estado = estado ?? doc.estado;
    doc.cargadoPor = req.user.id;
    await doc.save();

    res.json({ msg: "Actualizado", asistencia: doc });
  } catch (err) {
    console.error("Error en actualizarAsistencia:", err);
    res.status(err.status || 500).json({ msg: err.message || "Error al actualizar" });
  }
};

// DELETE /api/asistencias/:id  (admin)
export const eliminarAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID inválido" });
    }
    
    const deleted = await Asistencia.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }
    
    res.json({ msg: "Eliminado" });
  } catch (err) {
    console.error("Error en eliminarAsistencia:", err);
    res.status(500).json({ msg: "Error al eliminar" });
  }
};