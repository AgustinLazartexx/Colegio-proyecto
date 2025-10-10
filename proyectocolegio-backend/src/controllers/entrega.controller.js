import Entrega from "../models/Entrega.js";
import Tarea from "../models/TareaModel.js";

export const subirEntrega = async (req, res) => {
  const { tarea, comentario } = req.body;
  const archivo = req.file?.filename;

  if (!tarea || !archivo) {
    return res.status(400).json({ msg: "Tarea y archivo son obligatorios" });
  }

  try {
    // ✔️ Validación: ¿ya entregó esta tarea?
    const entregaExistente = await Entrega.findOne({
      tarea,
      alumno: req.user._id,
    });

    if (entregaExistente) {
      return res.status(400).json({
        msg: "Ya entregaste esta tarea. Solo se permite una entrega por alumno.",
      });
    }

    // ✔️ Crear la entrega
    const nuevaEntrega = new Entrega({
      tarea,
      alumno: req.user._id,
      archivo,
      comentario,
    });

    await nuevaEntrega.save();

    res.status(201).json({ msg: "Entrega subida exitosamente", entrega: nuevaEntrega });
  } catch (error) {
    console.error("Error al crear entrega:", error);
    res.status(500).json({ msg: "Hubo un error al subir la entrega" });
  }
};


export const obtenerEntregasPorTarea = async (req, res) => {
  try {
    const { tareaId } = req.params;
    
    // Verificar que la tarea existe y el profesor tiene acceso
    const tarea = await Tarea.findById(tareaId).populate('materia');
    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    // Verificar autorización
    if (req.user.rol !== "admin" && req.user.id !== tarea.profesor.toString()) {
      return res.status(403).json({ msg: "No tienes acceso a esta tarea" });
    }

    const entregas = await Entrega.find({ tarea: tareaId })
      .populate("alumno", "nombre apellido email")
      .populate("tarea", "titulo descripcion")
      .sort({ fecha: -1 });

    res.json(entregas);
    
  } catch (error) {
    console.error("Error al obtener entregas:", error);
    res.status(500).json({ msg: "Error al obtener las entregas" });
  }
};

// Método mejorado para corregir entrega
export const corregirEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota, comentario } = req.body;

    const entrega = await Entrega.findById(id)
      .populate({
        path: 'tarea',
        populate: {
          path: 'materia',
          select: 'profesor nombre'
        }
      });

    if (!entrega) {
      return res.status(404).json({ mensaje: "Entrega no encontrada" });
    }

    // Verificar autorización del profesor
    if (req.user.rol !== "admin" && 
        req.user.id !== entrega.tarea.profesor.toString()) {
      return res.status(403).json({ 
        mensaje: "No tienes autorización para corregir esta entrega" 
      });
    }

    // Validar nota si se proporciona
    if (nota !== undefined && nota !== "") {
      const notaNum = parseFloat(nota);
      if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
        return res.status(400).json({ 
          mensaje: "La nota debe ser un número entre 0 y 10" 
        });
      }
      entrega.nota = notaNum;
    }

    if (comentario !== undefined) {
      entrega.comentario = comentario;
    }
    
    // Marcar fecha de corrección
    entrega.fechaCorreccion = new Date();
    
    await entrega.save();

    // Retornar entrega actualizada con datos poblados
    const entregaActualizada = await Entrega.findById(id)
      .populate("alumno", "nombre apellido email")
      .populate("tarea", "titulo descripcion");

    res.status(200).json({ 
      mensaje: "Entrega corregida correctamente", 
      entrega: entregaActualizada 
    });

  } catch (error) {
    console.error("Error al corregir entrega:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};