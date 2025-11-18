import Materia from "../models/materia.model.js";
import User from "../models/user.model.js";

// ----------------------------------------------------
// Crear nueva materia (solo admin)
// ----------------------------------------------------
export const crearMateria = async (req, res) => {
  try {
    const { nombre, anio, profesor, division } = req.body;

    // Validar si ya existe
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
    const materias = await Materia.find().populate("profesor", "nombre apellido");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener las materias", error });
  }
};

// ----------------------------------------------------
// Obtener materias filtradas (GET /api/materias?anio=1)
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
    const materia = await Materia.findById(id).populate("profesor alumnos", "nombre apellido email");

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
// Inscribir alumno a materia (solo alumno)
// ----------------------------------------------------
export const inscribirseAMateria = async (req, res) => {
  try {
    const { id } = req.params;
    // CORREGIDO: Usar req.user.id (no req.uid)
    const alumnoId = req.user.id; 

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

// ----------------------------------------------------
// Ver alumnos inscriptos en una materia
// CORREGIDO: Aquí estaba el ERROR 500
// ----------------------------------------------------
export const verAlumnosMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const materia = await Materia.findById(id).populate("alumnos", "nombre apellido email");
    
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    // CORRECCIÓN: Usar req.user.rol y req.user.id de forma segura
    const esAdmin = req.user.rol === "admin";
    
    // Validamos si materia.profesor existe antes de hacer toString()
    const esProfesorAsignado = materia.profesor && (req.user.id === materia.profesor.toString());

    // Si no es admin ni el profe asignado, rechazar
    if (!esAdmin && !esProfesorAsignado) {
      return res.status(403).json({ msg: "Acceso denegado. No eres el profesor de esta materia." });
    }

    res.json(materia.alumnos);
  } catch (error) {
    console.error("Error en verAlumnosMateria:", error); // Ver error en consola del servidor
    res.status(500).json({ msg: "Error interno al obtener alumnos" });
  }
};

// ----------------------------------------------------
// Obtener materias del profesor logueado
// ----------------------------------------------------
export const obtenerMateriasDelProfesor = async (req, res) => {
  try {
    // CORREGIDO: Usar req.user.id
    const profesorId = req.user.id; 
    const materias = await Materia.find({ profesor: profesorId }).populate("alumnos", "nombre apellido email");
    
    res.json(materias);
  } catch (error) {
    console.error("Error al obtener materias del profesor:", error);
    res.status(500).json({ msg: "Error al obtener materias del profesor" });
  }
};

// ----------------------------------------------------
// Obtener alumnos de las materias del profesor autenticado
// ----------------------------------------------------
export const verAlumnosPorProfesor = async (req, res) => {
  try {
    // CORREGIDO: Usar req.user.id
    const profesorId = req.user.id;

    const materias = await Materia.find({ profesor: profesorId })
      .populate("alumnos", "nombre apellido email")
      .select("nombre alumnos");

    if (!materias || materias.length === 0) {
      // Devolver array vacío en lugar de error 404 para no romper el frontend
      return res.json([]); 
    }

    res.json(materias);
  } catch (error) {
    console.error("Error verAlumnosPorProfesor:", error);
    res.status(500).json({ msg: "Error al obtener los alumnos del profesor" });
  }
};

// ----------------------------------------------------
// Obtener todos los profesores
// ----------------------------------------------------
export const obtenerProfesores = async (req, res) => {
  try {
    const profesores = await User.find({ rol: "profesor" }).select("nombre apellido email");
    res.json(profesores);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los profesores", error });
  }
};