import User from "../models/User.js";

/**
 * 📘 Listar alumnos con filtros opcionales por año y división
 * Ejemplo:
 *   GET /api/alumnos?anio=3&division=A
 */
export const listarAlumnos = async (req, res) => {
  try {
    const { anio, division } = req.query;
    const filtros = { rol: "alumno" };

    // Aplicar filtros si vienen en la query
    if (anio) filtros.anio = parseInt(anio);
    if (division) filtros.division = division;

    console.log("📋 Filtros aplicados:", filtros);

    const alumnos = await User.find(filtros)
      .select("-password")
      .sort({ nombre: 1 });

    if (!alumnos.length) {
      return res.status(404).json({ msg: "No se encontraron alumnos con esos filtros" });
    }

    res.json(alumnos);
  } catch (error) {
    console.error("Error al listar alumnos:", error);
    res.status(500).json({
      msg: "Error interno al listar alumnos",
      error: error.message
    });
  }
};
