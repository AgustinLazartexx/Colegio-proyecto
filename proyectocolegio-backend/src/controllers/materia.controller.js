import Materia from "../models/materia.model.js";
import User from "../models/user.model.js";
import Clase from "../models/Clases.js"; // <--- IMPORTANTE: Asegúrate de importar el modelo Clase

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
// Ver alumnos de una materia (CORREGIDO)
// ----------------------------------------------------
export const verAlumnosMateria = async (req, res) => {
  try {
    const { id } = req.params; // ID de la Materia
    
    // 1. Intentar buscar la Clase asociada a esta Materia
    // Como la relación real de alumnos está en 'Clase', buscamos ahí primero.
    const clases = await Clase.find({ materia: id })
      .populate('alumnos', 'nombre apellido email dni');

    // Si encontramos clases con alumnos inscritos, devolvemos esos alumnos unificados
    let alumnosMap = new Map();
    if (clases && clases.length > 0) {
        clases.forEach(clase => {
            if (clase.alumnos && Array.isArray(clase.alumnos)) {
                clase.alumnos.forEach(alumno => {
                    if (alumno && alumno._id) {
                        alumnosMap.set(alumno._id.toString(), alumno);
                    }
                });
            }
        });
    }

    // Si encontramos alumnos en las clases, los devolvemos
    if (alumnosMap.size > 0) {
        const resultados = Array.from(alumnosMap.values());
        // Ordenar por apellido
        resultados.sort((a, b) => (a.apellido || "").localeCompare(b.apellido || ""));
        return res.json(resultados);
    }

    // 2. FALLBACK (Plan B): Si no hay clases creadas o alumnos inscritos en la clase,
    // buscamos todos los alumnos que coincidan con el AÑO y DIVISIÓN de la materia.
    const materia = await Materia.findById(id);
    if (materia) {
       const alumnosPorCurso = await User.find({ 
           rol: 'alumno', 
           anio: materia.anio, 
           division: materia.division 
       }).select('nombre apellido email dni');
       
       return res.json(alumnosPorCurso);
    }

    // Si no se encuentra nada
    return res.json([]);

  } catch (error) {
    console.error("Error al ver alumnos de materia:", error);
    res.status(500).json({ msg: "Error al obtener alumnos" });
  }
};

// ----------------------------------------------------
// Inscribir alumno (Delegado a Clases, pero mantenemos endpoint por compatibilidad si es necesario)
// ----------------------------------------------------
export const inscribirseAMateria = async (req, res) => {
    res.status(501).json({ msg: "Utilice la gestión de Clases para inscribir alumnos." });
};

// ----------------------------------------------------
// Obtener materias del profesor logueado
// ----------------------------------------------------
export const obtenerMateriasDelProfesor = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "Token inválido o usuario no encontrado" });
    }
    
    const profesorId = req.user.id; 
    
    const materias = await Materia.find({ profesor: profesorId })
        .populate("profesor", "nombre apellido email");
    
    res.json(materias);
  } catch (error) {
    console.error("Error al obtener materias del profesor:", error);
    res.status(500).json({ msg: "Error al obtener materias del profesor", error: error.message });
  }
};

// ----------------------------------------------------
// Obtener alumnos por profesor (Genérico)
// ----------------------------------------------------
export const verAlumnosPorProfesor = async (req, res) => {
   // Esta función puede expandirse en el futuro si necesitas ver todos tus alumnos sin filtrar por materia
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