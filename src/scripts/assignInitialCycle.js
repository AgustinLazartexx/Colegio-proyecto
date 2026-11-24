import { databaseId, executeSql, newDatabaseIdSql, queryRows, sequelize } from "../services/relationalData.service.js";
import { pool } from "../config/mariadb.js";

const cycleTables = [
  "clases",
  "school_notas_trimestrales",
  "school_calificaciones",
  "school_tareas",
  "school_asistencia_general",
  "school_cuotas",
];
const allowedStates = new Set(["PLANIFICADO", "ACTIVO", "RECUPERACION", "CERRADO"]);

const readArguments = (args) => {
  const options = { apply: false };
  for (const arg of args) {
    if (arg === "--aplicar") {
      options.apply = true;
      continue;
    }
    const match = arg.match(/^--(anio|estado)=(.+)$/);
    if (!match) throw new Error(`Argumento no reconocido: ${arg}`);
    options[match[1]] = match[2];
  }

  const year = Number(options.anio);
  if (!Number.isInteger(year) || year < 1900 || year > 9998) {
    throw new Error("Indique --anio=YYYY (entre 1900 y 9998).");
  }
  if (!allowedStates.has(options.estado)) {
    throw new Error("--estado debe ser PLANIFICADO, ACTIVO, RECUPERACION o CERRADO.");
  }

  return {
    ...options,
    year,
    startDate: `${year}-03-02`,
    endDate: `${year + 1}-03-02`,
    name: `Ciclo Lectivo ${year}`,
  };
};

const countRows = async (table) => {
  const [row] = await queryRows(`SELECT COUNT(*) AS total FROM ${table} WHERE ciclo_lectivo_id IS NULL`);
  return Number(row.total);
};

const ensureNoConflictingCycleLinks = async (cycleId, transaction) => {
  for (const table of cycleTables) {
    const [row] = await queryRows(
      `SELECT COUNT(*) AS total FROM ${table}
       WHERE ciclo_lectivo_id IS NOT NULL AND ciclo_lectivo_id <> UNHEX(:cycleId)`,
      { cycleId },
      transaction,
    );
    if (Number(row.total) > 0) {
      throw new Error(`${table} ya contiene registros vinculados a otro ciclo; no se modificó ningún dato.`);
    }
  }
};

const ensureStudentPlacementIsConsistent = async (cycleId, transaction) => {
  const conflicts = await queryRows(
    `SELECT HEX(ca.alumno_id) AS alumnoId
     FROM clase_alumnos ca
     JOIN clases c ON c.id = ca.clase_id
     WHERE ca.isActive = TRUE AND c.ciclo_lectivo_id = UNHEX(:cycleId)
     GROUP BY ca.alumno_id
     HAVING COUNT(DISTINCT CONCAT(c.nivel, ':', c.division)) > 1`,
    { cycleId },
    transaction,
  );
  if (conflicts.length) {
    throw new Error(`Hay alumnos activos asignados a más de un nivel/división: ${conflicts.map((row) => row.alumnoId).join(", ")}`);
  }

  const missingDivision = await queryRows(
    `SELECT HEX(u.id) AS alumnoId
     FROM users u
     LEFT JOIN clase_alumnos ca ON ca.alumno_id = u.id AND ca.isActive = TRUE
     LEFT JOIN clases c ON c.id = ca.clase_id AND c.ciclo_lectivo_id = UNHEX(:cycleId)
     WHERE u.rol = 'alumno'
     GROUP BY u.id, u.anio, u.division
     HAVING COALESCE(MIN(c.nivel), u.anio) BETWEEN 1 AND 6
       AND COALESCE(MIN(c.division), u.division) IS NULL`,
    { cycleId },
    transaction,
  );
  if (missingDivision.length) {
    throw new Error(`Hay alumnos con nivel pero sin división: ${missingDivision.map((row) => row.alumnoId).join(", ")}`);
  }
};

const createOrFindCycle = async (options, transaction) => {
  let [cycle] = await queryRows(
    `SELECT HEX(id) AS id, fecha_inicio AS fechaInicio, fecha_cierre AS fechaCierre, estado
     FROM ciclos_lectivos WHERE anio = :year FOR UPDATE`,
    { year: options.year },
    transaction,
  );

  if (cycle) {
    const start = new Date(cycle.fechaInicio).toISOString().slice(0, 10);
    const end = new Date(cycle.fechaCierre).toISOString().slice(0, 10);
    if (start !== options.startDate || end !== options.endDate || cycle.estado !== options.estado) {
      throw new Error("Ya existe ese ciclo con fechas o estado distintos; no se alteró.");
    }
    return databaseId(cycle.id);
  }

  const activeSlot = ["ACTIVO", "RECUPERACION"].includes(options.estado) ? 1 : null;
  await executeSql(
    `INSERT INTO ciclos_lectivos
       (id, anio, nombre, fecha_inicio, fecha_cierre, estado, slot_activo)
     VALUES (${newDatabaseIdSql}, :year, :name, :startDate, :endDate, :state, :slot)`,
    {
      year: options.year,
      name: options.name,
      startDate: options.startDate,
      endDate: options.endDate,
      state: options.estado,
      slot: activeSlot,
    },
    transaction,
  );
  [cycle] = await queryRows(
    "SELECT HEX(id) AS id FROM ciclos_lectivos WHERE anio = :year",
    { year: options.year },
    transaction,
  );
  return databaseId(cycle.id);
};

const createInitialEnrollments = async (cycleId, transaction) => {
  await executeSql(
    `INSERT INTO inscripciones_ciclo
       (id, alumno_id, ciclo_lectivo_id, nivel, division, estado_academico, cantidad_desaprobadas)
     SELECT ${newDatabaseIdSql}, u.id, UNHEX(:cycleId),
            COALESCE(MIN(c.nivel), u.anio), COALESCE(MIN(c.division), u.division), 'CURSANDO', 0
     FROM users u
     LEFT JOIN clase_alumnos ca ON ca.alumno_id = u.id AND ca.isActive = TRUE
     LEFT JOIN clases c ON c.id = ca.clase_id AND c.ciclo_lectivo_id = UNHEX(:cycleId)
     WHERE u.rol = 'alumno'
       AND NOT EXISTS (
         SELECT 1 FROM inscripciones_ciclo i
         WHERE i.alumno_id = u.id AND i.ciclo_lectivo_id = UNHEX(:cycleId)
       )
     GROUP BY u.id, u.anio, u.division
     HAVING COALESCE(MIN(c.nivel), u.anio) BETWEEN 1 AND 6
       AND COALESCE(MIN(c.division), u.division) IS NOT NULL`,
    { cycleId },
    transaction,
  );
};

const run = async () => {
  const options = readArguments(process.argv.slice(2));
  await sequelize.authenticate();

  const pendingCounts = {};
  for (const table of cycleTables) pendingCounts[table] = await countRows(table);
  const [studentCount] = await queryRows(
    "SELECT COUNT(*) AS total FROM users WHERE rol = 'alumno' AND anio BETWEEN 1 AND 6",
  );
  console.log(JSON.stringify({
    mode: options.apply ? "APLICAR" : "DRY RUN",
    ciclo: {
      anio: options.year,
      nombre: options.name,
      fechaInicio: options.startDate,
      fechaCierre: options.endDate,
      estado: options.estado,
    },
    registrosSinCiclo: pendingCounts,
    alumnosConNivelActual: Number(studentCount.total),
  }, null, 2));

  if (!options.apply) {
    console.log("No se escribió ningún dato. Agregue --aplicar para ejecutar el backfill.");
    return;
  }

  await sequelize.transaction(async (transaction) => {
    const cycleId = await createOrFindCycle(options, transaction);
    await ensureNoConflictingCycleLinks(cycleId, transaction);

    await executeSql(
      "UPDATE clases SET nivel = anio WHERE nivel IS NULL AND anio BETWEEN 1 AND 6",
      {},
      transaction,
    );
    for (const table of cycleTables) {
      await executeSql(
        `UPDATE ${table} SET ciclo_lectivo_id = UNHEX(:cycleId) WHERE ciclo_lectivo_id IS NULL`,
        { cycleId },
        transaction,
      );
    }

    await ensureStudentPlacementIsConsistent(cycleId, transaction);
    await createInitialEnrollments(cycleId, transaction);
  });

  console.log("Backfill inicial completado.");
};

run()
  .catch((error) => {
    console.error("No se pudo asignar el ciclo inicial:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([sequelize.close(), pool.end()]);
  });
