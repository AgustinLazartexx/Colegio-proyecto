import { randomUUID } from "node:crypto";
import { QueryTypes } from "sequelize";
import { curriculumRows, divisions } from "../data/curriculum.js";
import { buildWeeklySchedule } from "../utils/buildWeeklySchedule.js";
import { DB_DIALECT, pool, sequelize } from "../config/mariadb.js";

const isEnabled = (value) => value === true || value === 1 || value === "1";
const databaseId = () => randomUUID().replaceAll("-", "").toUpperCase();
const subjectKey = ({ nombre, anio, division }) => `${Number(anio)}|${division}|${nombre}`;

const loadClassSchedule = async () => {
  if (process.env.NODE_ENV === "production" || DB_DIALECT !== "mariadb") {
    throw new Error("Este seed solo se permite en la base MariaDB local.");
  }

  sequelize.options.logging = false;
  await sequelize.authenticate();

  await sequelize.transaction(async (transaction) => {
    const allSubjects = await sequelize.query(
      `SELECT HEX(id) AS id, nombre, anio, division, isActive
       FROM materias
       WHERE anio BETWEEN 1 AND 6 AND division IN (:divisions)
       ORDER BY anio, division, nombre`,
      { replacements: { divisions }, type: QueryTypes.SELECT, transaction, logging: false },
    );
    const subjectsByKey = new Map(allSubjects.map((subject) => [subjectKey(subject), subject]));
    const missingSubjects = curriculumRows.filter((subject) => !subjectsByKey.has(subjectKey(subject)));
    if (missingSubjects.length) {
      throw new Error(`Faltan ${missingSubjects.length} materias del plan antes de programar las clases.`);
    }

    const subjects = curriculumRows.map((curriculumSubject) => {
      const subject = subjectsByKey.get(subjectKey(curriculumSubject));
      if (!isEnabled(subject.isActive)) {
        throw new Error(`La materia de ${curriculumSubject.anio}° ${curriculumSubject.division} está inactiva.`);
      }
      return subject;
    });
    if (subjects.length !== 204) {
      throw new Error("El plan debe contener exactamente 204 materias para los años 1–6 y divisiones A/B/C.");
    }

    const teachers = await sequelize.query(
      "SELECT HEX(id) AS id FROM users WHERE rol = 'profesor' AND isActive = TRUE ORDER BY HEX(id)",
      { type: QueryTypes.SELECT, transaction, logging: false },
    );
    const teacherIds = teachers.map(({ id }) => id);
    if (teacherIds.length !== 22) {
      throw new Error(`Se esperaban 22 docentes activos y se encontraron ${teacherIds.length}.`);
    }

    const existingRows = await sequelize.query(
      `SELECT HEX(c.id) AS classId, HEX(c.materia_id) AS materiaId,
              m.nombre, c.anio, c.division, c.diaSemana,
              TIME_FORMAT(c.horaInicio, '%H:%i') AS horaInicio,
              TIME_FORMAT(c.horaFin, '%H:%i') AS horaFin, c.isActive,
              HEX(cp.profesor_id) AS profesorId
       FROM clases c
       JOIN materias m ON m.id = c.materia_id
       LEFT JOIN clase_profesores cp ON cp.clase_id = c.id
       ORDER BY c.id`,
      { type: QueryTypes.SELECT, transaction, logging: false },
    );
    const subjectIds = new Set(subjects.map(({ id }) => id));
    const existingClassesById = new Map();
    for (const row of existingRows) {
      let existing = existingClassesById.get(row.classId);
      if (!existing) {
        existing = {
          id: row.classId,
          materiaId: row.materiaId,
          nombre: row.nombre,
          anio: Number(row.anio),
          division: row.division,
          diaSemana: row.diaSemana,
          horaInicio: row.horaInicio,
          horaFin: row.horaFin,
          isActive: row.isActive,
          profesorIds: [],
        };
        existingClassesById.set(row.classId, existing);
      }
      if (row.profesorId) existing.profesorIds.push(row.profesorId);
    }

    const existingBySubject = new Map();
    const preservedClasses = [];
    for (const existing of existingClassesById.values()) {
      if (!subjectIds.has(existing.materiaId)) {
        preservedClasses.push(existing);
        continue;
      }
      if (existingBySubject.has(existing.materiaId)) {
        throw new Error("Hay más de una clase existente para una materia; se requiere revisión manual.");
      }
      existingBySubject.set(existing.materiaId, existing);
    }

    const reservations = preservedClasses
      .filter((clase) => isEnabled(clase.isActive))
      .map(({ anio, division, diaSemana, horaInicio, horaFin, profesorIds }) => ({
        anio,
        division,
        diaSemana,
        horaInicio,
        horaFin,
        profesorIds,
      }));
    const schedule = buildWeeklySchedule(subjects, teacherIds, reservations);
    for (const item of schedule) {
      const existing = existingBySubject.get(item.materiaId);
      const classId = existing?.id ?? databaseId();
      const replacements = {
        classId,
        materiaId: item.materiaId,
        diaSemana: item.diaSemana,
        horaInicio: item.horaInicio,
        horaFin: item.horaFin,
        duracion: item.duracion,
        anio: item.anio,
        division: item.division,
      };

      if (existing) {
        await sequelize.query(
          `UPDATE clases
           SET materia_id = UNHEX(:materiaId), diaSemana = :diaSemana,
               horaInicio = :horaInicio, horaFin = :horaFin, duracion = :duracion,
               anio = :anio, division = :division, isActive = TRUE
           WHERE id = UNHEX(:classId)`,
          { replacements, transaction, logging: false },
        );
      } else {
        await sequelize.query(
          `INSERT INTO clases
             (id, materia_id, diaSemana, horaInicio, horaFin, duracion, aula, anio, division, isActive)
           VALUES
             (UNHEX(:classId), UNHEX(:materiaId), :diaSemana, :horaInicio, :horaFin,
              :duracion, NULL, :anio, :division, TRUE)`,
          { replacements, transaction, logging: false },
        );
      }

      await sequelize.query(
        "DELETE FROM clase_profesores WHERE clase_id = UNHEX(:classId)",
        { replacements: { classId }, transaction, logging: false },
      );
      await sequelize.query(
        `INSERT INTO clase_profesores (clase_id, profesor_id)
         VALUES (UNHEX(:classId), UNHEX(:profesorId))`,
        {
          replacements: { classId, profesorId: item.profesorId },
          transaction,
          logging: false,
        },
      );
    }

    const subjectIdParameters = subjects.map((_, index) => `UNHEX(:subjectId${index})`);
    const subjectIdReplacements = Object.fromEntries(
      subjects.map(({ id }, index) => [`subjectId${index}`, id]),
    );
    const verifiedClasses = await sequelize.query(
      `SELECT HEX(c.id) AS id, c.anio, c.division, c.diaSemana,
              TIME_FORMAT(c.horaInicio, '%H:%i') AS horaInicio,
              TIME_FORMAT(c.horaFin, '%H:%i') AS horaFin, c.duracion, c.isActive,
              HEX(cp.profesor_id) AS profesorId, COUNT(cp.profesor_id) AS teacherCount
       FROM clases c
       JOIN materias m ON m.id = c.materia_id
       LEFT JOIN clase_profesores cp ON cp.clase_id = c.id
       WHERE m.id IN (${subjectIdParameters.join(", ")})
       GROUP BY c.id, c.anio, c.division, c.diaSemana, c.horaInicio, c.horaFin,
                c.duracion, c.isActive, cp.profesor_id`,
      {
        replacements: subjectIdReplacements,
        type: QueryTypes.SELECT,
        transaction,
        logging: false,
      },
    );
    if (
      verifiedClasses.length !== schedule.length
      || verifiedClasses.some((clase) =>
        Number(clase.duracion) !== 45
        || !isEnabled(clase.isActive)
        || Number(clase.teacherCount) !== 1
        || !teacherIds.includes(clase.profesorId)
        || clase.horaInicio < "08:00"
        || clase.horaFin > "12:30"
      )
    ) {
      throw new Error("La verificación de duración, horario o asignación docente falló.");
    }

    const [groupConflicts] = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM clases a JOIN clases b
         ON a.id < b.id AND a.anio = b.anio AND a.division = b.division
        AND a.diaSemana = b.diaSemana
        AND a.horaInicio < b.horaFin AND b.horaInicio < a.horaFin
       WHERE a.isActive = TRUE AND b.isActive = TRUE`,
      { type: QueryTypes.SELECT, transaction, logging: false },
    );
    const [teacherConflicts] = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM clases a
       JOIN clase_profesores ap ON ap.clase_id = a.id
       JOIN clases b
         ON a.id < b.id AND a.diaSemana = b.diaSemana
        AND a.horaInicio < b.horaFin AND b.horaInicio < a.horaFin
       JOIN clase_profesores bp ON bp.clase_id = b.id AND bp.profesor_id = ap.profesor_id
       WHERE a.isActive = TRUE AND b.isActive = TRUE`,
      { type: QueryTypes.SELECT, transaction, logging: false },
    );
    if (Number(groupConflicts.total) || Number(teacherConflicts.total)) {
      throw new Error("La verificación encontró superposiciones de horario o de docentes.");
    }

    const created = schedule.length - existingBySubject.size;
    console.log(JSON.stringify({
      scheduledClasses: schedule.length,
      created,
      reprogrammed: existingBySubject.size,
      preservedOutsidePlan: preservedClasses.length,
      activeTeachers: teacherIds.length,
      teacherAssignments: verifiedClasses.length,
      durationMinutes: 45,
      days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
      groupConflicts: Number(groupConflicts.total),
      teacherConflicts: Number(teacherConflicts.total),
    }));
  });
};

try {
  await loadClassSchedule();
} catch (error) {
  console.error("No se pudo cargar el horario de clases:", error.message);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
