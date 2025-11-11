import Materia from "../models/materia.model.js";
import User from "../models/user.model.js";

// Crear nueva materia (solo admin)
export const crearMateria = async (req, res) => {
  try {
    // 1. Obtenemos la división del body
    const { nombre, anio, profesor } = req.body;
    let { division } = req.body; // 'A', 'B', 'C' o undefined

    let divisionFinal = null;
    const anioNum = parseInt(anio, 10);

    // 2. Lógica de división
    if (anioNum > 0) {
      // Si es un año (1-6), la división es obligatoria
      if (!division || !["A", "B", "C"].includes(division.toUpperCase())) {
        return res.status(400).json({ msg: "La División ('A', 'B', o 'C') es requerida para este año" });
      }
      divisionFinal = division.toUpperCase();
    }
    // Si anioNum es 0 (Asistencia General), divisionFinal se queda como null

    // 3. Comprobar unicidad (ahora incluye la división)
    const existe = await Materia.findOne({ nombre, anio: anioNum, division: divisionFinal });
    if (existe) return res.status(400).json({ msg: "La materia ya existe para ese año y división" });

    // 4. Crear materia
    const nueva = new Materia({ nombre, anio: anioNum, division: divisionFinal, profesor });
    await nueva.save();

    res.status(201).json(nueva);
  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ msg: "Error: La materia ya existe (Índice duplicado)." });
    }
    res.status(500).json({ msg: "Error al crear materia", error });
  }
};

// --- FUNCIÓN UNIFICADA ---
// Obtener todas las materias (admin y profesores)
// Ahora también maneja los filtros de (GET /?anio=1&profesor=...)
export const obtenerMaterias = async (req, res) => {
  try {
    const { anio, profesor } = req.query; // Revisamos si hay filtros
    const filtro = {};

    if (anio) filtro.anio = anio;
    if (profesor) filtro.profesor = profesor;

    const materias = await Materia.find(filtro).populate("profesor", "nombre");
    res.json(materias);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener las materias", error });
  }
};
// --- FIN FUNCIÓN UNIFICADA ---


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
    // 1. Obtenemos división
    const { nombre, anio, profesor, division } = req.body;

    const materia = await Materia.findById(id);
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    // 2. Actualizamos campos
    if (nombre) materia.nombre = nombre;
    if (anio !== undefined) materia.anio = anio;
    if (profesor) materia.profesor = profesor;

    // 3. Lógica de división
    // Si 'anio' se cambia a 0, forzamos división a null
    if (anio && parseInt(anio, 10) === 0) {
        materia.division = null;
    } 
    // Si se especifica una división (A, B, C, o null)
    else if (division !== undefined) {
        materia.division = division ? division.toUpperCase() : null;
    }

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
// NOTA: Esto debería ser más inteligente y filtrar por la división del alumno
// pero por ahora sigue la lógica original.
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
    const alumnoId = req.user.id; // ID del alumno desde el token (checkAuth)

    const materia = await Materia.findById(id);
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    // Validar que el alumno sea del mismo año y división que la materia
    const alumno = await User.findById(alumnoId).select("anio division");
    if (materia.anio !== 0) { // No validar para materias generales (anio 0)
        if (materia.anio !== alumno.anio || materia.division !== alumno.division) {
            return res.status(403).json({ msg: "No puedes inscribirte a una materia de otro curso." });
        }
    }

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
    const materia = await Materia.findById(id).populate("alumnos", "nombre email anio division");
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada" });

    // Solo admin o el profesor asignado puede ver esto
    if (req.user.rol !== "admin" && req.user.id !== materia.profesor.toString()) {
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
      .populate("alumnos", "nombre email anio division")
      .select("nombre anio division alumnos");

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

// ELIMINADA: obtenerMateriasFiltradas (se unificó con obtenerMaterias)

export const getMateriasPorAlumno = async (req, res) => {
  try {
    const { id } = req.params;

    const materias = await Materia.find({ alumnos: id }).populate("profesor", "nombre email");

    res.status(200).json(materias);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener materias del alumno", error });
  }
};