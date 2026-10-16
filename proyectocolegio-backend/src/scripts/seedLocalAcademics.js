import { QueryTypes } from "sequelize";
import { pool, sequelize } from "../config/mariadb.js";

const subjects = [
  { nombre: "Matemática", anio: 1, division: "A", profesorEmail: "profesor1@colegio.test" },
  { nombre: "Lengua", anio: 1, division: "A", profesorEmail: "profesor2@colegio.test" },
  { nombre: "Matemática", anio: 2, division: "B", profesorEmail: "profesor1@colegio.test" },
  { nombre: "Lengua", anio: 2, division: "B", profesorEmail: "profesor2@colegio.test" },
];

const schedules = [
  { subject: "Matemática", anio: 1, division: "A", diaSemana: "Lunes", horaInicio: "08:00", horaFin: "09:00", aula: "Aula 1" },
  { subject: "Lengua", anio: 1, division: "A", diaSemana: "Martes", horaInicio: "09:00", horaFin: "10:00", aula: "Aula 2" },
  { subject: "Matemática", anio: 2, division: "B", diaSemana: "Miércoles", horaInicio: "08:00", horaFin: "09:00", aula: "Aula 3" },
  { subject: "Lengua", anio: 2, division: "B", diaSemana: "Jueves", horaInicio: "09:00", horaFin: "10:00", aula: "Aula 4" },
];

const getTeacher = async (email) => {
  const [teacher] = await sequelize.query(
    "SELECT HEX(id) AS id FROM users WHERE email = :email AND rol = 'profesor' LIMIT 1",
    { replacements: { email }, type: QueryTypes.SELECT },
  );
  if (!teacher) throw new Error(`Falta el profesor de prueba ${email}. Ejecuta npm run seed:local primero.`);
  return teacher.id;
};

try {
  await sequelize.authenticate();
  const teacherIds = new Map();
  for (const subject of subjects) {
    if (!teacherIds.has(subject.profesorEmail)) {
      teacherIds.set(subject.profesorEmail, await getTeacher(subject.profesorEmail));
    }
  }

  const studentRows = await sequelize.query(
    `SELECT HEX(id) AS id, anio, division FROM users
     WHERE rol = 'alumno' AND email IN ('alumno1@colegio.test', 'alumno2@colegio.test')`,
    { type: QueryTypes.SELECT },
  );
  if (studentRows.length !== 2) {
    throw new Error("Faltan alumnos de prueba. Ejecuta npm run seed:local primero.");
  }

  for (const subject of subjects) {
    const profesorId = teacherIds.get(subject.profesorEmail);
    const [existing] = await sequelize.query(
      `SELECT HEX(id) AS id FROM materias
       WHERE nombre = :nombre AND anio = :anio AND division = :division LIMIT 1`,
      {
        replacements: subject,
        type: QueryTypes.SELECT,
      },
    );

    if (existing) {
      console.log(`Se conserva la materia existente ${subject.nombre}, ${subject.anio}° ${subject.division}.`);
      continue;
    }

    await sequelize.query(
      `INSERT INTO materias (id, nombre, anio, division, profesor_id, descripcion)
       VALUES (UNHEX(REPLACE(UUID(), '-', '')), :nombre, :anio, :division, UNHEX(:profesorId), 'Materia local de prueba')`,
      { replacements: { ...subject, profesorId } },
    );
    console.log(`Creada materia ${subject.nombre}, ${subject.anio}° ${subject.division}.`);
  }

  for (const schedule of schedules) {
    const [subject] = await sequelize.query(
      `SELECT HEX(id) AS id, HEX(profesor_id) AS profesorId
       FROM materias WHERE nombre = :nombre AND anio = :anio AND division = :division LIMIT 1`,
      {
        replacements: {
          nombre: schedule.subject,
          anio: schedule.anio,
          division: schedule.division,
        },
        type: QueryTypes.SELECT,
      },
    );
    if (!subject) throw new Error(`No se encontró la materia ${schedule.subject}, ${schedule.anio}° ${schedule.division}.`);

    let [classRow] = await sequelize.query(
      `SELECT HEX(id) AS id FROM clases
       WHERE materia_id = UNHEX(:materiaId) AND diaSemana = :diaSemana AND horaInicio = :horaInicio
         AND anio = :anio AND division = :division LIMIT 1`,
      {
        replacements: {
          materiaId: subject.id,
          diaSemana: schedule.diaSemana,
          horaInicio: schedule.horaInicio,
          anio: schedule.anio,
          division: schedule.division,
        },
        type: QueryTypes.SELECT,
      },
    );

    if (!classRow) {
      await sequelize.query(
        `INSERT INTO clases (id, materia_id, diaSemana, horaInicio, horaFin, aula, anio, division)
         VALUES (UNHEX(REPLACE(UUID(), '-', '')), UNHEX(:materiaId), :diaSemana, :horaInicio, :horaFin, :aula, :anio, :division)`,
        {
          replacements: {
            materiaId: subject.id,
            diaSemana: schedule.diaSemana,
            horaInicio: schedule.horaInicio,
            horaFin: schedule.horaFin,
            aula: schedule.aula,
            anio: schedule.anio,
            division: schedule.division,
          },
        },
      );
      [classRow] = await sequelize.query(
        `SELECT HEX(id) AS id FROM clases
         WHERE materia_id = UNHEX(:materiaId) AND diaSemana = :diaSemana AND horaInicio = :horaInicio
           AND anio = :anio AND division = :division ORDER BY createdAt DESC LIMIT 1`,
        {
          replacements: {
            materiaId: subject.id,
            diaSemana: schedule.diaSemana,
            horaInicio: schedule.horaInicio,
            anio: schedule.anio,
            division: schedule.division,
          },
          type: QueryTypes.SELECT,
        },
      );
      console.log(`Creada clase de ${schedule.subject}: ${schedule.diaSemana} ${schedule.horaInicio}.`);
    } else {
      console.log(`Se conserva la clase existente de ${schedule.subject}: ${schedule.diaSemana} ${schedule.horaInicio}.`);
    }

    await sequelize.query(
      `INSERT IGNORE INTO clase_profesores (clase_id, profesor_id)
       VALUES (UNHEX(:classId), UNHEX(:profesorId))`,
      { replacements: { classId: classRow.id, profesorId: subject.profesorId } },
    );

    const matchingStudents = studentRows.filter(
      (student) => Number(student.anio) === schedule.anio && student.division === schedule.division,
    );
    for (const student of matchingStudents) {
      await sequelize.query(
        `INSERT IGNORE INTO clase_alumnos (clase_id, alumno_id)
         VALUES (UNHEX(:classId), UNHEX(:studentId))`,
        { replacements: { classId: classRow.id, studentId: student.id } },
      );
    }
  }

  console.log("Materias, horarios y asignaciones de prueba listos.");
} catch (error) {
  console.error("No se pudieron cargar los datos académicos locales:", error);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
