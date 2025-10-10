import Tarea from "../models/Tarea.js";
import Materia from "../models/materia.model.js";

export const crearTarea = async (req, res) => {
  try {
    const { titulo, descripcion, fechaEntrega, materia } = req.body;
    const profesorId = req.user.id;

    // Verificamos que la materia exista y que sea suya
    const materiaDB = await Materia.findById(materia);
    if (!materiaDB) return res.status(404).json({ msg: "Materia no encontrada" });
    if (materiaDB.profesor.toString() !== profesorId)
      return res.status(403).json({ msg: "No puedes crear tareas en esta materia" });

    const nuevaTarea = new Tarea({
      titulo,
      descripcion,
      fechaEntrega,
      materia,
      profesor: profesorId,
      archivo: req.file ? req.file.filename : null,
    });

    await nuevaTarea.save();
    res.json({ msg: "Tarea creada con éxito", tarea: nuevaTarea });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear tarea" });
  }
};

export const obtenerTareasPorMateria = async (req, res) => {
  const { materiaId } = req.params;

  try {
    const tareas = await Tarea.find({ materia: materiaId }).sort({ fechaEntrega: 1 }); // orden opcional
    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas por materia:", error);
    res.status(500).json({ msg: "Error al obtener las tareas" });
  }
};

// Obtener tareas por profesor
export const obtenerTareasByProfesor = async (req, res) => {
  try {
    const { profesorId } = req.params;
    
    // Verificar autorización - solo el profesor o admin puede ver sus tareas
    if (req.user.rol !== "admin" && req.user.id !== profesorId) {
      return res.status(403).json({ msg: "No tienes autorización" });
    }

    const tareas = await Tarea.find({ profesor: profesorId })
      .populate('materia', 'nombre anio')
      .sort({ createdAt: -1 });

    res.json(tareas);
    
  } catch (error) {
    console.error('Error al obtener tareas del profesor:', error);
    res.status(500).json({ msg: "Error al obtener las tareas" });
  }
};