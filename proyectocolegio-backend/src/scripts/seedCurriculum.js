import { QueryTypes } from "sequelize";
import { pool, sequelize, DB_DIALECT } from "../config/mariadb.js";
import { curriculum, curriculumRows, divisions } from "../data/curriculum.js";
const insertConflictClause = DB_DIALECT === "postgres"
  ? 'ON CONFLICT (nombre, anio, division) DO UPDATE SET "isActive" = TRUE'
  : "ON DUPLICATE KEY UPDATE isActive = TRUE";

const verifyCurriculum = async (transaction) => {
  const rows = await sequelize.query(
    `SELECT nombre, anio, division, isActive
     FROM materias
     WHERE anio BETWEEN 1 AND 6 AND division IN (:divisions)`,
    {
      replacements: { divisions },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  const existingRows = new Set(
    rows
      .filter(({ isActive }) => isActive === true || isActive === 1 || isActive === "1")
      .map(({ nombre, anio, division }) => `${Number(anio)}|${division}|${nombre}`),
  );
  const missingRows = curriculumRows.filter(
    ({ nombre, anio, division }) => !existingRows.has(`${anio}|${division}|${nombre}`),
  );

  if (missingRows.length) {
    const sample = missingRows
      .slice(0, 5)
      .map(({ nombre, anio, division }) => `${anio}° ${division}: ${nombre}`)
      .join(", ");
    throw new Error(
      `No se verificaron ${missingRows.length} materias del plan. Ejemplos: ${sample}.`,
    );
  }
};

try {
  sequelize.options.logging = false;
  await sequelize.authenticate();
  await sequelize.transaction(async (transaction) => {
    for (const { nombre, anio, division } of curriculumRows) {
      await sequelize.query(
        `INSERT INTO materias (id, nombre, descripcion, anio, division, profesor_id, isActive)
         VALUES (
           UNHEX(REPLACE(UUID(), '-', '')),
           :nombre,
           :descripcion,
           :anio,
           :division,
           NULL,
           TRUE
         )
         ${insertConflictClause}`,
        {
          replacements: {
            nombre,
            descripcion: `Plan de estudios - Año ${anio}`,
            anio,
            division,
          },
          transaction,
        },
      );
    }

    await verifyCurriculum(transaction);
  });

  const yearCounts = curriculum.map(({ anio, materias }) => ({
    anio,
    materias: materias.length,
    filasConDivisiones: materias.length * divisions.length,
  }));
  console.log(
    `Plan de estudios verificado: ${curriculumRows.length} materias (${divisions.join(", ")}) en 6 años.`,
  );
  console.log(JSON.stringify(yearCounts, null, 2));
} catch (error) {
  console.error("No se pudo cargar el plan de estudios:", error);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
