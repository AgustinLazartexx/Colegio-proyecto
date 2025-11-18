// src/controllers/alumnos.controller.js
import User from "../models/User.js"; // Asegúrate que la ruta sea correcta

/**
 * 📘 Listar alumnos con filtros por año y división
 * Ejemplo:
 * GET /api/alumnos?anio=3&division=A
 */
export const listarAlumnosPorCurso = async (req, res) => {
  try {
    const { anio, division } = req.query;
    
    if (!anio || !division) {
      return res.status(400).json({ msg: "Debe indicar año y división" });
    }

    const filtros = { 
      rol: "alumno",
      anio: parseInt(anio),
      division: division.toUpperCase()
    };

    console.log("📋 Filtros aplicados:", filtros);

    const alumnos = await User.find(filtros)
      .select("-contraseña") // Corregido de 'password' a 'contraseña'
      .sort({ nombre: 1 });

    if (!alumnos.length) {
      return res.status(404).json({ msg: "No se encontraron alumnos con esos filtros" });
    }

    res.json(alumnos);
  } catch (error)
 {
    console.error("Error al listar alumnos:", error);
    res.status(500).json({
      msg: "Error interno al listar alumnos",
      error: error.message
    });
  }
};