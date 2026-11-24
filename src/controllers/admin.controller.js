import { QueryTypes } from "sequelize";
import { sequelize } from "../config/mariadb.js";
import { calculateSubjectResult } from "../services/academicCycleRules.js";
import { cycleDateOnly, getCycleById } from "../services/cycleAccess.service.js";
import { databaseId, isDatabaseId, queryRows } from "../services/relationalData.service.js";

const argentinaDate = () => {
  const date = new Date();
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
      weekday: "short",
    }).format(date),
  };
};

export const getAdminStats = async (req, res) => {
  const requestedCycleId = req.query.cicloLectivoId;
  if (requestedCycleId && !isDatabaseId(requestedCycleId)) {
    return res.status(400).json({ msg: "ID de ciclo lectivo inválido." });
  }

  try {
    const [[usuarios], [materias], [clases]] = await Promise.all([
      sequelize.query(
      `SELECT
         SUM(rol = 'alumno') AS alumnos,
         SUM(rol = 'profesor') AS profesores
       FROM users`,
      { type: QueryTypes.SELECT },
      ),
      sequelize.query("SELECT COUNT(*) AS total FROM materias", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM clases", { type: QueryTypes.SELECT }),
    ]);

    const response = {
      alumnos: Number(usuarios.alumnos ?? 0),
      profesores: Number(usuarios.profesores ?? 0),
      materias: Number(materias.total ?? 0),
      clases: Number(clases.total ?? 0),
      ciclo: null,
      alumnosActivos: null,
      clasesCiclo: null,
      cuotasPendientes: null,
      cuotasVencidas: null,
      alumnosEnRiesgo: null,
      alumnosEnRiesgoDetalle: [],
      cursosSinAsistencia: null,
      cursosSinAsistenciaDetalle: [],
    };

    if (!requestedCycleId) return res.json(response);

    const cycle = await getCycleById(requestedCycleId);
    const cycleId = databaseId(cycle.id);
    const [studentRows, classRows, quotaRows, gradeRows] = await Promise.all([
      queryRows(
        `SELECT COUNT(DISTINCT i.alumno_id) AS total
         FROM inscripciones_ciclo i
         JOIN users u ON u.id = i.alumno_id AND u.isActive = TRUE
         WHERE i.ciclo_lectivo_id = UNHEX(:cycleId) AND i.estado_academico <> 'BAJA'`,
        { cycleId },
      ),
      queryRows(
        `SELECT COUNT(*) AS total FROM clases
         WHERE ciclo_lectivo_id = UNHEX(:cycleId) AND isActive = TRUE`,
        { cycleId },
      ),
      queryRows(
        `SELECT SUM(estado = 'pendiente') AS pendientes,
                SUM(estado = 'vencido') AS vencidas
         FROM school_cuotas WHERE ciclo_lectivo_id = UNHEX(:cycleId)`,
        { cycleId },
      ),
      queryRows(
        `SELECT HEX(i.alumno_id) AS alumnoId, u.nombre AS alumnoNombre, u.dni,
                i.nivel, i.division, HEX(m.id) AS materiaId, m.nombre AS materia,
                MAX(CASE WHEN n.trimestre = 1 THEN n.nota_final_trimestre END) AS trimestre1,
                MAX(CASE WHEN n.trimestre = 2 THEN n.nota_final_trimestre END) AS trimestre2,
                MAX(CASE WHEN n.trimestre = 3 THEN n.nota_final_trimestre END) AS trimestre3,
                MAX(r.nota_recuperacion) AS notaRecuperacion
         FROM inscripciones_ciclo i
         JOIN users u ON u.id = i.alumno_id AND u.isActive = TRUE
         JOIN (
           SELECT DISTINCT nivel, division, materia_id
           FROM clases
           WHERE ciclo_lectivo_id = UNHEX(:cycleId) AND isActive = TRUE
         ) c ON c.nivel = i.nivel AND c.division = i.division
         JOIN materias m ON m.id = c.materia_id AND m.isActive = TRUE
         LEFT JOIN school_notas_trimestrales n
           ON n.ciclo_lectivo_id = i.ciclo_lectivo_id
           AND n.materia_id = m.id AND n.alumno_id = i.alumno_id
         LEFT JOIN school_resultados_materia r
           ON r.ciclo_lectivo_id = i.ciclo_lectivo_id
           AND r.materia_id = m.id AND r.alumno_id = i.alumno_id
         WHERE i.ciclo_lectivo_id = UNHEX(:cycleId) AND i.estado_academico <> 'BAJA'
         GROUP BY i.alumno_id, u.nombre, u.dni, i.nivel, i.division, m.id, m.nombre
         HAVING MAX(CASE WHEN n.trimestre = 1 THEN n.nota_final_trimestre END) IS NOT NULL
            AND MAX(CASE WHEN n.trimestre = 2 THEN n.nota_final_trimestre END) IS NOT NULL
            AND MAX(CASE WHEN n.trimestre = 3 THEN n.nota_final_trimestre END) IS NOT NULL`,
        { cycleId },
      ),
    ]);

    const studentsAtRisk = new Map();
    for (const row of gradeRows) {
      const result = calculateSubjectResult({
        ...row,
        notaRecuperacion: row.notaRecuperacion,
      });
      if (
        result.puntajeFinal >= 18 ||
        result.puntajeFinal === null ||
        result.estadoMateria === "APROBADA_RECUPERACION"
      ) continue;
      const student = studentsAtRisk.get(row.alumnoId) || {
        alumnoId: row.alumnoId,
        nombre: row.alumnoNombre,
        dni: row.dni,
        nivel: Number(row.nivel),
        division: row.division,
        materias: [],
      };
      student.materias.push({
        materiaId: row.materiaId,
        nombre: row.materia,
        puntajeFinal: result.puntajeFinal,
        estado: row.notaRecuperacion == null ? "A_RECUPERACION" : result.estadoMateria,
      });
      studentsAtRisk.set(row.alumnoId, student);
    }

    const { date, weekday } = argentinaDate();
    let coursesWithoutAttendance = [];
    if (
      ["ACTIVO", "RECUPERACION"].includes(cycle.estado) &&
      ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday) &&
      date >= cycleDateOnly(cycle.fechaInicio) &&
      date <= cycleDateOnly(cycle.fechaCierre)
    ) {
      coursesWithoutAttendance = await queryRows(
        `SELECT i.nivel AS anio, i.division
         FROM inscripciones_ciclo i
         JOIN users u ON u.id = i.alumno_id AND u.isActive = TRUE
         WHERE i.ciclo_lectivo_id = UNHEX(:cycleId) AND i.estado_academico = 'CURSANDO'
         GROUP BY i.nivel, i.division
         HAVING NOT EXISTS (
           SELECT 1 FROM school_asistencia_general a
           WHERE a.ciclo_lectivo_id = UNHEX(:cycleId)
             AND a.anio = i.nivel AND a.division = i.division AND a.fecha = :date
         )
         ORDER BY i.nivel, i.division`,
        { cycleId, date },
      );
    }

    response.ciclo = {
      _id: cycle.id,
      anio: Number(cycle.anio),
      nombre: cycle.nombre,
      fechaInicio: cycle.fechaInicio,
      fechaCierre: cycle.fechaCierre,
      estado: cycle.estado,
    };
    response.alumnosActivos = Number(studentRows[0]?.total ?? 0);
    response.clasesCiclo = Number(classRows[0]?.total ?? 0);
    response.cuotasPendientes = Number(quotaRows[0]?.pendientes ?? 0);
    response.cuotasVencidas = Number(quotaRows[0]?.vencidas ?? 0);
    response.alumnosEnRiesgo = studentsAtRisk.size;
    response.alumnosEnRiesgoDetalle = [...studentsAtRisk.values()];
    response.cursosSinAsistencia = coursesWithoutAttendance.length;
    response.cursosSinAsistenciaDetalle = coursesWithoutAttendance.map((row) => ({
      anio: Number(row.anio),
      division: row.division,
    }));

    return res.json(response);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ msg: err.message });
    console.error("Error al obtener estadísticas de administración:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
