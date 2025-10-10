// Controller: controllers/admin.controller.js
import Usuario from "../models/User.js";
import Materia from "../models/materia.model.js";

export const getAdminStats = async (req, res) => {
  try {
    const alumnos = await Usuario.countDocuments({ rol: "alumno" });
    const profesores = await Usuario.countDocuments({ rol: "profesor" });
    const materias = await Materia.countDocuments();

    res.json({ alumnos, profesores, materias });
  } catch (err) {
    console.error("Error al obtener stats del admin", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
