import { QueryTypes } from "sequelize";
import { pool, sequelize, DB_DIALECT } from "../config/mariadb.js";

const curriculum = [
  {
    anio: 1,
    materias: [
      "Lengua",
      "Lengua Extranjera",
      "Matemática",
      "Geografía",
      "Historia",
      "Biología",
      "Físico-Química",
      "Educación Artística",
      "Tecnología / Informática",
      "Educación Física",
      "Formación Moral / Religión",
      "E.D.I.",
      "Tutoría",
    ],
  },
  {
    anio: 2,
    materias: [
      "Lengua",
      "Lengua Extranjera",
      "Matemática",
      "Geografía",
      "Historia",
      "Biología",
      "Físico-Química",
      "Educación Artística",
      "Tecnología / Informática",
      "Educación Ética y Ciudadana",
      "Educación Física",
      "Formación Moral / Religión",
      "E.D.I.",
      "Tutoría",
    ],
  },
  {
    anio: 3,
    materias: [
      "Lengua",
      "Lengua Extranjera",
      "Matemática",
      "Geografía",
      "Historia",
      "Biología",
      "Físico-Química",
      "Educación Artística",
      "Tecnología / Informática",
      "Educación Ética y Ciudadana",
      "Educación Física",
      "Formación Moral / Religión",
      "E.D.I.",
      "Tutoría",
    ],
  },
  {
    anio: 4,
    materias: [
      "Lengua I",
      "Lengua Extranjera I",
      "Matemática I",
      "Biología I",
      "Física I",
      "Geografía I",
      "Historia I",
      "Tecnologías de Gestión",
      "Educación Física I",
      "E.D.I.",
      "Tutoría",
    ],
  },
  {
    anio: 5,
    materias: [
      "Lengua y Literatura II",
      "Lengua Extranjera II",
      "Matemática II",
      "Espacio Propio de Modalidad",
      "Derecho I",
      "Economía I",
      "Sistema de Información",
      "Teoría y Gestión de las Organizaciones I",
      "Educación Física II",
      "E.D.I.",
      "Tutoría",
    ],
  },
  {
    anio: 6,
    materias: [
      "Lengua y Literatura III",
      "Lengua Extranjera III",
      "Matemática Aplicada",
      "Economía II",
      "Sistema de Información Contable",
    ],
  },
];

const divisions = ["A", "B", "C"];
const curriculumRows = curriculum.flatMap(({ anio, materias }) =>
  materias.flatMap((nombre) =>
    divisions.map((division) => ({ nombre, anio, division })),
  ),
);
const insertConflictClause = DB_DIALECT === "postgres"
  ? "ON CONFLICT (nombre, anio, division) DO NOTHING"
  : "ON DUPLICATE KEY UPDATE id = id";

const verifyCurriculum = async (transaction) => {
  const rows = await sequelize.query(
    `SELECT nombre, anio, division
     FROM materias
     WHERE anio BETWEEN 1 AND 6 AND division IN (:divisions)`,
    {
      replacements: { divisions },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  const existingRows = new Set(
    rows.map(({ nombre, anio, division }) => `${Number(anio)}|${division}|${nombre}`),
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
  await sequelize.authenticate();
  await sequelize.transaction(async (transaction) => {
    for (const { nombre, anio, division } of curriculumRows) {
      await sequelize.query(
        `INSERT INTO materias (id, nombre, descripcion, anio, division, profesor_id)
         VALUES (
           UNHEX(REPLACE(UUID(), '-', '')),
           :nombre,
           :descripcion,
           :anio,
           :division,
           NULL
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
