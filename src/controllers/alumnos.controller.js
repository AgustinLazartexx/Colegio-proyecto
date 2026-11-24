import { databaseId, isDatabaseId, queryRows } from "../services/relationalData.service.js";
import { getActiveCycle, getCycleById } from "../services/cycleAccess.service.js";

export const listarAlumnosPorCurso = async (req, res) => {
  const { anio, division } = req.query;
  const year = Number(anio);
  const group = typeof division === "string" ? division.trim().toUpperCase() : "";
  if (!Number.isInteger(year) || year < 1 || year > 6 || !/^[A-Z]$/.test(group)) {
    return res.status(400).json({ msg: "Debe indicar año y división válidos." });
  }
  try {
    const cycle = req.query.cicloLectivoId
      ? await getCycleById(req.query.cicloLectivoId)
      : await getActiveCycle();
    const rows = await queryRows(
      `SELECT HEX(u.id) AS _id, HEX(u.id) AS id, u.nombre, u.email, u.dni, u.rol,
              u.codigoAlumno, i.nivel AS anio, i.division, u.isActive,
              u.acceso_habilitado AS acceso_habilitado
       FROM inscripciones_ciclo i
       JOIN users u ON u.id = i.alumno_id
       WHERE i.ciclo_lectivo_id = UNHEX(:cycleId) AND i.nivel = :anio
         AND i.division = :division AND i.estado_academico = 'CURSANDO'
         AND u.rol = 'alumno' AND u.isActive = TRUE
       ORDER BY u.nombre`,
      { cycleId: databaseId(cycle.id), anio: year, division: group },
    );
    if (!rows.length) return res.json([]);
    return res.json(rows.map((row) => ({ ...row, isActive: Boolean(row.isActive), acceso_habilitado: Boolean(row.acceso_habilitado) })));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
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
       WHERE ca.clase_id = UNHEX(:claseId) AND ca.isActive = TRUE AND u.isActive = TRUE
       ORDER BY u.nombre`,
      { claseId: databaseId(claseId) },
    );
    return res.json(rows);
  } catch (error) {
    console.error("Error listando alumnos de clase:", error);
    return res.status(500).json({ msg: "Error al listar alumnos de clase." });
  }
};
