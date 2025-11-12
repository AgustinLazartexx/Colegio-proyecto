import Materia from "../models/materia.model.js";
import User from "../models/user.model.js";

// Crear nueva materia (solo admin)
export const crearMateria = async (req, res) => {
  try {
    const { nombre, anio, profesor, division } = req.body;

    // CORREGIDO: Se incluye la 'division' en la comprobación de existencia
    const existe = await Materia.findOne({ nombre, anio, division });
    if (existe) {
      return res.status(400).json({ msg: "La materia ya existe para ese año y división" });
    }

    // CORREGIDO: Se usa la variable 'materia' (no 'nueva')
    const materia = new Materia({ nombre, anio, profesor, division });
    await materia.save();

    res.status(201).json(materia);
  } catch (error) {
    res.status(500).json({ msg: "Error al crear materia", error });
  }
};

// Obtener todas las materias (admin y profesores)
export const obtenerMaterias = async (req, res) => {
  try {
    // MEJORA: Se añade 'apellido' al populate para que coincida con el frontend
    const materias = await Materia.find().populate("profesor", "nombre apellido");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener las materias", error });
  }
};

// Obtener una materia por ID
export const obtenerMateria = async (req, res) => {
  try {
    const { id } = req.params;
    // MEJORA: Se añade 'apellido' al populate
    const materia = await Materia.findById(id).populate("profesor alumnos", "nombre apellido email");

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
    const { nombre, anio, profesor, division } = req.body;

    // CORREGIDO: 'updateData' se define ANTES de usarse
    const updateData = { nombre, anio, profesor, division };

    // CORREGIDO: findByIdAndUpdate ya guarda, no se necesita .save() extra
    const materia = await Materia.findByIdAndUpdate(id, updateData, { new: true });
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

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
    // MEJORA: Se añade 'apellido' al populate
    const materias = await Materia.find({ anio }).populate("profesor", "nombre apellido");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al filtrar por año" });
  }
};

// Inscribir alumno a materia (solo alumno)
export const inscribirseAMateria = async (req, res) => {
  try {
    const { id } = req.params;
    // CORREGIDO: Se usa 'alumnoId' para no sobreescribir el modelo 'User'
    const alumnoId = req.uid; 

    console.log("ID recibido:", id);
    console.log("ID del usuario autenticado:", alumnoId);

    const materia = await Materia.findById(id);
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    if (materia.alumnos.includes(alumnoId)) {
      return res.status(400).json({ msg: "Ya estás inscripto en esta materia" });
    }

    materia.alumnos.push(alumnoId);
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
    // MEJORA: Se añade 'apellido' al populate
    const materia = await Materia.findById(id).populate("alumnos", "nombre apellido email");
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
    // MEJORA: Se añade 'apellido' al populate
    const materias = await Materia.find({ profesor: profesorId }).populate("alumnos", "nombre apellido email");
    
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
      // MEJORA: Se añade 'apellido' al populate
      .populate("alumnos", "nombre apellido email")
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
    // MEJORA: Se selecciona 'apellido' además de 'nombre' y 'email'
    const profesores = await User.find({ rol: "profesor" }).select("nombre apellido email");
    res.json(profesores);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los profesores", error });
  }
};

// Obtener materias filtradas
export const obtenerMateriasFiltradas = async (req, res) => {
  try {
    const { anio, profesor } = req.query;
    const filtro = {};
    if (anio) filtro.anio = anio;
    if (profesor) filtro.profesor = profesor;

    // MEJORA: Se añade 'apellido' al populate
    const materias = await Materia.find(filtro).populate("profesor", "nombre apellido");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al filtrar materias", error });
  }
};

// Obtener materias por alumno
export const getMateriasPorAlumno = async (req, res) => {
  try {
    const { id } = req.params;

    // MEJORA: Se añade 'apellido' al populate
    const materias = await Materia.find({ alumnos: id }).populate("profesor", "nombre apellido email");

    res.status(200).json(materias);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener materias del alumno", error });
  }
};