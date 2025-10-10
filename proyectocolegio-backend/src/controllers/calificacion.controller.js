import Calificacion from "../models/calificacion.model.js";
import Materia from "../models/materia.model.js";
import User from "../models/User.js";

// ✅ Crear calificación
export const crearCalificacion = async (req, res) => {
  try {
    const { materia, alumno, descripcion, nota } = req.body;
    const profesorId = req.user.id;

    // Validamos si el profesor dicta la materia
    const materiaDB = await Materia.findById(materia);
    if (!materiaDB)
      return res.status(404).json({ msg: "Materia no encontrada" });

    if (materiaDB.profesor.toString() !== profesorId)
      return res.status(403).json({ msg: "No tienes acceso a esta materia" });

    // Verificamos que el alumno esté inscripto en la materia
    if (!materiaDB.alumnos.includes(alumno))
      return res.status(400).json({ msg: "El alumno no está inscripto" });

    const nueva = new Calificacion({
      materia,
      alumno,
      profesor: profesorId,
      descripcion,
      nota,
    });

    await nueva.save();

    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear calificación", error });
  }
};

// ✅ Ver calificaciones de una materia (profesor)
export const obtenerCalificacionesPorMateria = async (req, res) => {
  try {
    const { idMateria } = req.params;
    const profesorId = req.user.id;

    // Validamos si el profesor dicta la materia
    const materiaDB = await Materia.findById(idMateria);
    if (!materiaDB)
      return res.status(404).json({ msg: "Materia no encontrada" });

    if (materiaDB.profesor.toString() !== profesorId)
      return res.status(403).json({ msg: "No autorizado" });

    const calificaciones = await Calificacion.find({ materia: idMateria })
      .populate("alumno", "nombre email")
      .sort({ createdAt: -1 });

    res.json(calificaciones);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener calificaciones" });
  }
};

// ✅ Ver calificaciones del alumno (para el alumno)
export const obtenerCalificacionesAlumno = async (req, res) => {
  try {
    const alumnoId = req.user.id;

    const calificaciones = await Calificacion.find({ alumno: alumnoId })
      .populate("materia", "nombre anio")
      .sort({ createdAt: -1 });

    res.json(calificaciones);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener tus calificaciones" });
  }
};

export const actualizarCalificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota } = req.body;

    const calificacion = await Calificacion.findById(id).populate("materia");
    if (!calificacion) return res.status(404).json({ msg: "Calificación no encontrada" });

    // Verifica que el profesor que intenta editar sea el asignado
    if (req.user.rol !== "admin" && req.uid !== calificacion.materia.profesor.toString()) {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    calificacion.nota = nota;
    await calificacion.save();

    res.json({ msg: "Calificación actualizada", calificacion });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar la calificación" });
  }
};

export const eliminarCalificacion = async (req, res) => {
  try {
    const { id } = req.params;

    const calificacion = await Calificacion.findById(id).populate("materia");
    if (!calificacion) return res.status(404).json({ msg: "Calificación no encontrada" });

    if (req.user.rol !== "admin" && req.uid !== calificacion.materia.profesor.toString()) {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    await calificacion.deleteOne();

    res.json({ msg: "Calificación eliminada" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar la calificación" });
  }
};
