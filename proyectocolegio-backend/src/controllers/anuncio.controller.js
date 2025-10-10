import Anuncio from "../models/Anuncio.js";
import Materia from "../models/materia.model.js";

export const crearAnuncio = async (req, res) => {
  try {
    console.log("📩 Datos recibidos en crearAnuncio:", req.body);
    console.log("👤 Usuario autenticado:", req.user);

    const anuncio = new Anuncio({
      profesor: req.user.id,
      materia: req.body.materia, // ahora coincide con el frontend
      titulo: req.body.titulo,
      mensaje: req.body.mensaje   // ahora coincide con el frontend
    });

    await anuncio.save();
    res.status(201).json({ msg: "Anuncio creado con éxito", anuncio });
  } catch (error) {
    console.error("❌ Error en crearAnuncio:", error);
    res.status(500).json({ msg: "Error al crear anuncio", error });
  }
};



export const obtenerAnunciosAlumno = async (req, res) => {
  try {
    const { idAlumno } = req.params;

    // Buscar las materias en las que está inscripto el alumno
    const materias = await Materia.find({ alumnos: idAlumno }).select("_id");
    const materiaIds = materias.map(m => m._id);

    // Si no está en ninguna materia, devolvemos vacío
    if (materiaIds.length === 0) {
      return res.json([]);
    }

    // Buscar anuncios de esas materias
    const anuncios = await Anuncio.find({ materia: { $in: materiaIds } })
      .populate("profesor", "nombre")
      .populate("materia", "nombre")
      .sort({ fecha: -1 });

    res.json(anuncios);
  } catch (err) {
    console.error("❌ Error en obtenerAnunciosAlumno:", err);
    res.status(500).json({ message: "Error al obtener anuncios", error: err.message });
  }
};

// Obtener todos los anuncios de un profesor
export const obtenerAnunciosProfesor = async (req, res) => {
  try {
    const profesorId = req.user.id; // viene del token
    const anuncios = await Anuncio.find({ profesor: profesorId })
      .populate("materia", "nombre")
      .sort({ fecha: -1 });

    res.json(anuncios);
  } catch (err) {
    console.error("❌ Error en obtenerAnunciosProfesor:", err);
    res.status(500).json({ msg: "Error al obtener anuncios del profesor", error: err.message });
  }
};

// Actualizar anuncio (solo si es del profesor que lo creó)
export const actualizarAnuncio = async (req, res) => {
  try {
    const { id } = req.params;

    let anuncio = await Anuncio.findById(id);
    if (!anuncio) {
      return res.status(404).json({ msg: "Anuncio no encontrado" });
    }

    // Verificar que el profesor sea el dueño del anuncio
    if (anuncio.profesor.toString() !== req.user.id) {
      return res.status(403).json({ msg: "No autorizado para modificar este anuncio" });
    }

    anuncio.titulo = req.body.titulo || anuncio.titulo;
    anuncio.mensaje = req.body.mensaje || anuncio.mensaje;
    anuncio.materia = req.body.materia || anuncio.materia;

    await anuncio.save();
    res.json({ msg: "Anuncio actualizado con éxito", anuncio });
  } catch (err) {
    console.error("❌ Error en actualizarAnuncio:", err);
    res.status(500).json({ msg: "Error al actualizar anuncio", error: err.message });
  }
};

// Eliminar anuncio (solo si es del profesor que lo creó)
export const eliminarAnuncio = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await Anuncio.findById(id);
    if (!anuncio) {
      return res.status(404).json({ msg: "Anuncio no encontrado" });
    }

    if (anuncio.profesor.toString() !== req.user.id) {
      return res.status(403).json({ msg: "No autorizado para eliminar este anuncio" });
    }

    await anuncio.deleteOne();
    res.json({ msg: "Anuncio eliminado con éxito" });
  } catch (err) {
    console.error("❌ Error en eliminarAnuncio:", err);
    res.status(500).json({ msg: "Error al eliminar anuncio", error: err.message });
  }
};
