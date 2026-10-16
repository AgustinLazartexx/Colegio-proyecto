import { QueryTypes } from "sequelize";
import { sequelize } from "../config/mariadb.js";

export const getAdminStats = async (req, res) => {
  try {
    const [usuarios] = await sequelize.query(
      `SELECT
         SUM(rol = 'alumno') AS alumnos,
         SUM(rol = 'profesor') AS profesores
       FROM users`,
      { type: QueryTypes.SELECT },
    );
    const [materias] = await sequelize.query(
      "SELECT COUNT(*) AS total FROM materias",
      { type: QueryTypes.SELECT },
    );
    const [clases] = await sequelize.query(
      "SELECT COUNT(*) AS total FROM clases",
      { type: QueryTypes.SELECT },
    );

    res.json({
      alumnos: Number(usuarios.alumnos ?? 0),
      profesores: Number(usuarios.profesores ?? 0),
      materias: Number(materias.total ?? 0),
      clases: Number(clases.total ?? 0),
    });
  } catch (err) {
    console.error("Error al obtener estadísticas de administración:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
