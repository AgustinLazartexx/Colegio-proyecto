import { databaseId, isDatabaseId, queryRows } from "../services/relationalData.service.js";

export const listarAlumnosPorCurso = async (req, res) => {
  const { anio, division } = req.query;
  const year = Number(anio);
  const group = typeof division === "string" ? division.trim().toUpperCase() : "";
  if (!Number.isInteger(year) || year < 1 || year > 6 || !/^[A-Z]$/.test(group)) {
    return res.status(400).json({ msg: "Debe indicar año y división válidos." });
  }
  try {
    const rows = await queryRows(
      `SELECT HEX(id) AS _id, HEX(id) AS id, nombre, email, dni, rol, codigoAlumno, anio, division,
              isActive, acceso_habilitado AS acceso_habilitado
       FROM users WHERE rol = 'alumno' AND anio = :anio AND division = :division AND isActive = TRUE
       ORDER BY nombre`,
      { anio: year, division: group },
    );
    if (!rows.length) return res.status(404).json({ msg: "No se encontraron alumnos con esos filtros." });
    return res.json(rows.map((row) => ({ ...row, isActive: Boolean(row.isActive), acceso_habilitado: Boolean(row.acceso_habilitado) })));
  } catch (error) {
    console.error("Error listando alumnos por curso:", error);
    return res.status(500).json({ msg: "Error interno al listar alumnos." });
  }
};

export const obtenerAlumnosDeClase = async (req, res) => {
  const { claseId } = req.params;
  if (!isDatabaseId(claseId)) return res.status(400).json({ msg: "ID de clase inválido." });
  try {
    const rows = await queryRows(
      `SELECT HEX(u.id) AS _id, HEX(u.id) AS id, u.nombre, u.email, u.dni, u.anio, u.division
       FROM clase_alumnos ca JOIN users u ON u.id = ca.alumno_id
       WHERE ca.clase_id = UNHEX(:claseId) AND u.isActive = TRUE
       ORDER BY u.nombre`,
      { claseId: databaseId(claseId) },
    );
    return res.json(rows);
  } catch (error) {
    console.error("Error listando alumnos de clase:", error);
    return res.status(500).json({ msg: "Error al listar alumnos de clase." });
  }
};
