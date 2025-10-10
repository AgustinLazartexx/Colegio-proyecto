// src/controllers/materia.controller.js
import Materia from "../models/materia.model.js";
import User from "../models/user.model.js";

// Crear nueva materia (solo admin)
export const crearMateria = async (req, res) => {
  try {
    const { nombre, anio, profesor } = req.body;

    const existe = await Materia.findOne({ nombre, anio });
    if (existe) return res.status(400).json({ msg: "La materia ya existe para ese año" });

    const nueva = new Materia({ nombre, anio, profesor });
    await nueva.save();

    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear materia", error });
  }
};

// Obtener todas las materias (admin y profesores)

export const obtenerMaterias = async (req, res) => {
  try {
    const materias = await Materia.find().populate("profesor", "nombre");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener las materias", error });
  }
};


// Obtener una materia por ID
export const obtenerMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const materia = await Materia.findById(id).populate("profesor alumnos", "nombre email");

    if (!materia) {
      return res.status(404).json({ msg: "Materia no encontrada" });
    }

    res.json(materia);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener la materia", error });
  }
};

// Actualizar una materia
export const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, anio, profesor } = req.body;

    const materia = await Materia.findById(id);
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    if (nombre) materia.nombre = nombre;
    if (anio) materia.anio = anio;
    if (profesor) materia.profesor = profesor;

    await materia.save();

    res.json({ msg: "Materia actualizada", materia });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar materia", error });
  }
};

// Eliminar una materia
export const eliminarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const materia = await Materia.findById(id);

    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    await materia.deleteOne();

    res.json({ msg: "Materia eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar materia", error });
  }
};





// Obtener materias por año (para alumnos)
export const obtenerMateriasPorAnio = async (req, res) => {
  try {
    const { anio } = req.params;
    const materias = await Materia.find({ anio }).populate("profesor", "nombre");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al filtrar por año" });
  }
};

// Inscribir alumno a materia (solo alumno)
export const inscribirseAMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const User = req.uid; // ID del alumno desde el token

    console.log("ID recibido:", id);
    console.log("ID del usuario autenticado:", User);

    const materia = await Materia.findById(id);
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    if (materia.alumnos.includes(User)) {
      return res.status(400).json({ msg: "Ya estás inscripto en esta materia" });
    }

    materia.alumnos.push(User);
    await materia.save();

    res.json({ msg: "Inscripción exitosa", materia });
  } catch (error) {
    console.error("Error en inscripción:", error);
    res.status(500).json({ msg: "Error al inscribirse" });
  }
};


// Ver alumnos inscriptos en una materia (profesor asignado o admin)
export const verAlumnosMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const materia = await Materia.findById(id).populate("alumnos", "nombre email");
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    // Solo admin o el profesor asignado puede ver esto
    if (req.rol !== "admin" && req.uid !== materia.profesor.toString()) {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    res.json(materia.alumnos);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener inscriptos" });
  }
};

// Obtener materias del profesor logueado
export const obtenerMateriasDelProfesor = async (req, res) => {
  try {
    const profesorId = req.user.id; // viene del token
    const materias = await Materia.find({ profesor: profesorId }).populate("alumnos", "nombre email");
    
    res.json(materias);
  } catch (error) {
    console.error("Error al obtener materias del profesor:", error);
    res.status(500).json({ msg: "Error al obtener materias del profesor" });
  }
};



// Obtener alumnos de las materias del profesor autenticado
export const verAlumnosPorProfesor = async (req, res) => {
  try {
    const profesorId = req.user.id;
    console.log("ID del profesor autenticado:", profesorId);

    const materias = await Materia.find({ profesor: profesorId })
      .populate("alumnos", "nombre email")
      .select("nombre alumnos");

    if (materias.length === 0) {
      return res.status(404).json({ msg: "No se encontraron materias asignadas al profesor" });
    }

    res.json(materias);
  } catch (error) {
    console.error("Error exacto:", error);
    res.status(500).json({ msg: "Error al obtener los alumnos del profesor" });
  }
};

// Obtener todos los profesores (para el admin al asignar materias)
export const obtenerProfesores = async (req, res) => {
  try {
    const profesores = await User.find({ rol: "profesor" }).select("nombre email");
    res.json(profesores);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los profesores", error });
  }
};

export const obtenerMateriasFiltradas = async (req, res) => {
  try {
    const { anio, profesor } = req.query;
    const filtro = {};
    if (anio) filtro.anio = anio;
    if (profesor) filtro.profesor = profesor;

    const materias = await Materia.find(filtro).populate("profesor", "nombre");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al filtrar materias", error });
  }
};

export const getMateriasPorAlumno = async (req, res) => {
  try {
    const { id } = req.params;

    const materias = await Materia.find({ alumnos: id }).populate("profesor", "nombre email");

    res.status(200).json(materias);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener materias del alumno", error });
  }
};
