import Materia from "../models/materia.model.js";
import User from "../models/user.model.js";

// ----------------------------------------------------
// Crear nueva materia (solo admin)
// ----------------------------------------------------
export const crearMateria = async (req, res) => {
  try {
    const { nombre, anio, profesor, division } = req.body;

    const existe = await Materia.findOne({ nombre, anio, division });
    if (existe) {
      return res.status(400).json({ msg: "La materia ya existe para ese año y división" });
    }

    const materia = new Materia({ nombre, anio, profesor, division });
    await materia.save();

    res.status(201).json(materia);
  } catch (error) {
    console.error("Error crear materia:", error);
    res.status(500).json({ msg: "Error al crear materia", error });
  }
};

// ----------------------------------------------------
// Obtener todas las materias (admin y profesores)
// ----------------------------------------------------
export const obtenerMaterias = async (req, res) => {
  try {
    // CORRECCIÓN: Quitamos 'alumnos' del populate si existía antes
    const materias = await Materia.find().populate("profesor", "nombre apellido");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener las materias", error });
  }
};

// ----------------------------------------------------
// Obtener materias filtradas
// ----------------------------------------------------
export const obtenerMateriasFiltradas = async (req, res) => {
  try {
    const { anio, profesor } = req.query;
    const filtro = {};
    if (anio) filtro.anio = anio;
    if (profesor) filtro.profesor = profesor;

    const materias = await Materia.find(filtro).populate("profesor", "nombre apellido");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al filtrar materias", error });
  }
};

// ----------------------------------------------------
// Obtener una materia por ID
// ----------------------------------------------------
export const obtenerMateria = async (req, res) => {
  try {
    const { id } = req.params;
    // CORRECCIÓN: Eliminado 'alumnos' del populate. Solo traemos profesor.
    const materia = await Materia.findById(id).populate("profesor", "nombre apellido email");

    if (!materia) {
      return res.status(404).json({ msg: "Materia no encontrada" });
    }

    res.json(materia);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener la materia", error });
  }
};

// ----------------------------------------------------
// Actualizar una materia
// ----------------------------------------------------
export const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, anio, profesor, division } = req.body;

    const updateData = { nombre, anio, profesor, division };

    const materia = await Materia.findByIdAndUpdate(id, updateData, { new: true });
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    res.json({ msg: "Materia actualizada", materia });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar materia", error });
  }
};

// ----------------------------------------------------
// Eliminar una materia
// ----------------------------------------------------
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

// ----------------------------------------------------
// Inscribir alumno (ESTA LÓGICA DEBE CAMBIAR A 'CLASES' EN EL FUTURO)
// Por ahora la dejamos comentada o retornamos error si ya no usas el array en Materia
// ----------------------------------------------------
export const inscribirseAMateria = async (req, res) => {
    // Si ya no tienes el campo 'alumnos', esta función dará error.
    // Deberías mover esta lógica al controlador de Clases.
    res.status(501).json({ msg: "Funcionalidad movida a gestión de Clases" });
};

// ----------------------------------------------------
// Ver alumnos de una materia
// NOTA: Como quitaste el array, esto ya no funcionará leyendo de Materia.
// Debes buscar en el modelo 'Clase' o 'Usuario' filtrando por año/división.
// ----------------------------------------------------
export const verAlumnosMateria = async (req, res) => {
  // Devolvemos array vacío temporalmente para que no rompa el front
  res.json([]); 
};

// ----------------------------------------------------
// Obtener materias del profesor logueado (CORREGIDA)
// ----------------------------------------------------
export const obtenerMateriasDelProfesor = async (req, res) => {
  try {
    // Validación extra de seguridad
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "Token inválido o usuario no encontrado" });
    }
    
    const profesorId = req.user.id; 
    
    // CORRECCIÓN IMPORTANTE: Eliminado .populate("alumnos")
    // Ya no existe el campo alumnos, así que no intentamos poblarlo.
    const materias = await Materia.find({ profesor: profesorId })
        .populate("profesor", "nombre apellido email");
    
    res.json(materias);
  } catch (error) {
    console.error("Error al obtener materias del profesor:", error);
    res.status(500).json({ msg: "Error al obtener materias del profesor", error: error.message });
  }
};

// ----------------------------------------------------
// Obtener alumnos por profesor
// ----------------------------------------------------
export const verAlumnosPorProfesor = async (req, res) => {
   // Misma situación: 'alumnos' ya no existe en Materia.
   // Devolvemos vacío para evitar el crash hasta que conectes con el modelo 'Clase'
   res.json([]);
};

export const obtenerProfesores = async (req, res) => {
  try {
    const profesores = await User.find({ rol: "profesor" }).select("nombre apellido email");
    res.json(profesores);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los profesores", error });
  }
};