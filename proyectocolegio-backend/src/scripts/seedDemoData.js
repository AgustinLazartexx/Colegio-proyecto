import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { QueryTypes } from "sequelize";
import { DB_DIALECT, pool, sequelize } from "../config/mariadb.js";

const adminEmail = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
const userPassword = process.env.DEMO_USER_PASSWORD;
const demoSeedEnabled = process.env.DEMO_SEED_ENABLED === "true";

const toBytes = (uuid) => Buffer.from(uuid.replaceAll("-", ""), "hex");

const currentAcademicCycle = () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentYear = Number(todayIso.slice(0, 4));
  const year = todayIso < `${currentYear}-03-02` ? currentYear - 1 : currentYear;
  return {
    year,
    name: `Ciclo Lectivo ${year}`,
    startDate: `${year}-03-02`,
    endDate: `${year + 1}-03-02`,
  };
};

const cycleBackfillTables = [
  "clases",
  "school_notas_trimestrales",
  "school_calificaciones",
  "school_tareas",
  "school_asistencia_general",
  "school_cuotas",
];

const ensureActiveCycle = async (transaction) => {
  const existingActive = await sequelize.query(
    `SELECT HEX(id) AS id FROM ciclos_lectivos
     WHERE estado IN ('ACTIVO', 'RECUPERACION')
     ORDER BY anio DESC LIMIT 1`,
    { type: QueryTypes.SELECT, transaction },
  );
  if (existingActive.length) return existingActive[0].id;

  const cycle = currentAcademicCycle();
  await sequelize.query(
    `INSERT INTO ciclos_lectivos
       (id, anio, nombre, fecha_inicio, fecha_cierre, estado, slot_activo)
     VALUES (:id, :anio, :nombre, :fechaInicio, :fechaCierre, 'ACTIVO', 1)
     ON CONFLICT (anio) DO NOTHING`,
    {
      replacements: {
        id: toBytes("00000000-0000-4000-8000-000000000001"),
        anio: cycle.year,
        nombre: cycle.name,
        fechaInicio: cycle.startDate,
        fechaCierre: cycle.endDate,
      },
      transaction,
    },
  );

  const [row] = await sequelize.query(
    "SELECT HEX(id) AS id FROM ciclos_lectivos WHERE anio = :anio LIMIT 1",
    { replacements: { anio: cycle.year }, type: QueryTypes.SELECT, transaction },
  );
  if (!row) throw new Error("No se pudo recuperar el ciclo lectivo demo.");
  return row.id;
};

const createUser = async (transaction, id, user, passwordHash) => {
  await sequelize.query(
    `INSERT INTO users
       (id, nombre, email, password, dni, rol, codigoAlumno, anio, division,
        isActive, mustChangePassword, acceso_habilitado)
     VALUES
       (:id, :nombre, :email, :password, :dni, :rol, :codigoAlumno, :anio, :division,
        TRUE, FALSE, TRUE)
     ON CONFLICT (id) DO NOTHING`,
    {
      replacements: {
        id: toBytes(id),
        ...user,
        password: passwordHash,
        codigoAlumno: user.codigoAlumno ?? null,
        anio: user.anio ?? null,
        division: user.division ?? null,
      },
      transaction,
    },
  );

  const [row] = await sequelize.query(
    "SELECT HEX(id) AS id FROM users WHERE id = UNHEX(:id) LIMIT 1",
    { replacements: { id: id.replaceAll("-", "") }, type: QueryTypes.SELECT, transaction },
  );
  if (!row) throw new Error(`No se pudo recuperar el usuario demo ${user.email}.`);
  return row.id;
};

const findId = async (transaction, sql, replacements) => {
  const [row] = await sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
    transaction,
  });
  if (!row) throw new Error("No se pudo recuperar un registro necesario para la demo.");
  return row.id;
};

const insertRecord = (transaction, sql, replacements) =>
  sequelize.query(sql, { replacements, transaction });

try {
  if (DB_DIALECT !== "postgres") {
    throw new Error("El seed demo solo se permite con DB_DIALECT=postgres.");
  }
  if (!demoSeedEnabled) {
    throw new Error("Activa DEMO_SEED_ENABLED=true solo para la base ficticia de la demo.");
  }
  if (!adminEmail || !adminPassword || !userPassword) {
    throw new Error("Configura DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD y DEMO_USER_PASSWORD.");
  }
  if (adminPassword.length < 12 || userPassword.length < 12) {
    throw new Error("Las contraseñas de la demo deben tener al menos 12 caracteres.");
  }

  await sequelize.authenticate();
  await sequelize.transaction(async (transaction) => {
    const cycleId = await ensureActiveCycle(transaction);

    await insertRecord(
      transaction,
      "UPDATE clases SET nivel = anio WHERE nivel IS NULL AND anio BETWEEN 1 AND 6",
      {},
    );
    for (const table of cycleBackfillTables) {
      await insertRecord(
        transaction,
        `UPDATE ${table} SET ciclo_lectivo_id = UNHEX(:cycleId) WHERE ciclo_lectivo_id IS NULL`,
        { cycleId },
      );
    }

    const adminId = await createUser(
      transaction,
      "10000000-0000-4000-8000-000000000001",
      {
        nombre: "Administrador Demo",
        email: adminEmail,
        dni: "70000001",
        rol: "admin",
      },
      await bcrypt.hash(adminPassword, 12),
    );
    const teacherId = await createUser(
      transaction,
      "10000000-0000-4000-8000-000000000002",
      {
        nombre: "Martina Rios",
        email: "docente@colegio.test",
        dni: "70000002",
        rol: "profesor",
      },
      await bcrypt.hash(userPassword, 12),
    );
    const studentIds = [];

    for (const student of [
      {
        nombre: "Lucia Perez",
        email: "alumna@colegio.test",
        dni: "70000003",
        rol: "alumno",
        codigoAlumno: "DEMO-001",
        anio: 1,
        division: "A",
      },
      {
        nombre: "Mateo Gomez",
        email: "alumno@colegio.test",
        dni: "70000004",
        rol: "alumno",
        codigoAlumno: "DEMO-002",
        anio: 1,
        division: "A",
      },
    ]) {
      const stableId = student.email === "alumna@colegio.test"
        ? "10000000-0000-4000-8000-000000000003"
        : "10000000-0000-4000-8000-000000000004";
      const studentId = await createUser(
        transaction,
        stableId,
        student,
        await bcrypt.hash(userPassword, 12),
      );
      studentIds.push(studentId);

      await insertRecord(
        transaction,
        `INSERT INTO inscripciones_ciclo
           (id, alumno_id, ciclo_lectivo_id, nivel, division, estado_academico, cantidad_desaprobadas)
         VALUES (:id, UNHEX(:studentId), UNHEX(:cycleId), 1, 'A', 'CURSANDO', 0)
         ON CONFLICT (alumno_id, ciclo_lectivo_id) DO NOTHING`,
        {
          id: toBytes(randomUUID()),
          studentId,
          cycleId,
        },
      );
    }

    const subjects = [];
    for (const subject of [
      { nombre: "Matematica", diaSemana: "Lunes", horaInicio: "08:00", horaFin: "09:00", aula: "Aula 1" },
      { nombre: "Lengua", diaSemana: "Martes", horaInicio: "09:00", horaFin: "10:00", aula: "Aula 2" },
    ]) {
      await insertRecord(
        transaction,
        `INSERT INTO materias (id, nombre, descripcion, anio, division, profesor_id)
         VALUES (:id, :nombre, 'Materia de muestra con datos ficticios', 1, 'A', UNHEX(:teacherId))
         ON CONFLICT (nombre, anio, division) DO NOTHING`,
        {
          id: toBytes(randomUUID()),
          nombre: subject.nombre,
          teacherId,
        },
      );

      const materiaId = await findId(
        transaction,
        "SELECT HEX(id) AS id FROM materias WHERE nombre = :nombre AND anio = 1 AND division = 'A' LIMIT 1",
        { nombre: subject.nombre },
      );

      await insertRecord(
        transaction,
        `INSERT INTO clases
           (id, ciclo_lectivo_id, materia_id, diaSemana, horaInicio, horaFin, duracion, aula, anio, nivel, division)
         VALUES (:id, UNHEX(:cycleId), UNHEX(:materiaId), :diaSemana, :horaInicio, :horaFin, 60, :aula, 1, 1, 'A')
         ON CONFLICT (ciclo_lectivo_id, materia_id, diaSemana, horaInicio, nivel, division) DO NOTHING`,
        {
          id: toBytes(randomUUID()),
          cycleId,
          materiaId,
          ...subject,
        },
      );

      const claseId = await findId(
        transaction,
        `SELECT HEX(id) AS id FROM clases
         WHERE ciclo_lectivo_id = UNHEX(:cycleId) AND materia_id = UNHEX(:materiaId)
           AND diaSemana = :diaSemana AND horaInicio = :horaInicio
           AND nivel = 1 AND division = 'A' LIMIT 1`,
        { cycleId, materiaId, diaSemana: subject.diaSemana, horaInicio: subject.horaInicio },
      );
      subjects.push({ ...subject, materiaId, claseId });

      await insertRecord(
        transaction,
        `INSERT INTO clase_profesores (clase_id, profesor_id)
         VALUES (UNHEX(:claseId), UNHEX(:teacherId))
         ON CONFLICT (clase_id, profesor_id) DO NOTHING`,
        { claseId, teacherId },
      );
      for (const studentId of studentIds) {
        await insertRecord(
          transaction,
          `INSERT INTO clase_alumnos (clase_id, alumno_id, isActive)
           VALUES (UNHEX(:claseId), UNHEX(:studentId), TRUE)
           ON CONFLICT (clase_id, alumno_id) DO NOTHING`,
          { claseId, studentId },
        );
      }
    }

    const [mathSubject, languageSubject] = subjects;
    for (let index = 0; index < studentIds.length; index += 1) {
      const studentId = studentIds[index];
      const grade = index === 0 ? "8.50" : "7.00";
      const gradeId = index === 0
        ? "30000000-0000-4000-8000-000000000001"
        : "30000000-0000-4000-8000-000000000002";

      await insertRecord(
        transaction,
        `INSERT INTO school_calificaciones
           (id, ciclo_lectivo_id, materia_id, alumno_id, profesor_id, descripcion, nota)
         VALUES (:id, UNHEX(:cycleId), UNHEX(:materiaId), UNHEX(:studentId), UNHEX(:teacherId), 'Evaluacion de muestra', :nota)
         ON CONFLICT (id) DO NOTHING`,
        {
          id: toBytes(gradeId),
          cycleId,
          materiaId: mathSubject.materiaId,
          studentId,
          teacherId,
          nota: grade,
        },
      );
      await insertRecord(
        transaction,
        `INSERT INTO school_notas_trimestrales
           (id, ciclo_lectivo_id, materia_id, alumno_id, trimestre, orientadora, proceso, integradora,
            promedio_ponderado, nota_final_trimestre, observacion)
         VALUES (:id, UNHEX(:cycleId), UNHEX(:materiaId), UNHEX(:studentId), 1, :nota, :nota, :nota,
                 :nota, :nota, 'Calificacion ficticia para demostracion')
         ON CONFLICT (ciclo_lectivo_id, materia_id, alumno_id, trimestre) DO NOTHING`,
        {
          id: toBytes(index === 0
            ? "30000000-0000-4000-8000-000000000003"
            : "30000000-0000-4000-8000-000000000004"),
          cycleId,
          materiaId: mathSubject.materiaId,
          studentId,
          nota: grade,
        },
      );

      await insertRecord(
        transaction,
        `INSERT INTO school_cuotas (id, ciclo_lectivo_id, alumno_id, mes, anio, monto, estado, fecha_vencimiento)
         VALUES (:id, UNHEX(:cycleId), UNHEX(:studentId), CAST(EXTRACT(MONTH FROM CURRENT_DATE) AS INTEGER),
                 CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS INTEGER), 12500, 'pendiente', CURRENT_DATE + 10)
         ON CONFLICT (alumno_id, mes, anio) DO NOTHING`,
        {
          id: toBytes(index === 0
            ? "30000000-0000-4000-8000-000000000005"
            : "30000000-0000-4000-8000-000000000006"),
          cycleId,
          studentId,
        },
      );
    }

    const taskId = "40000000-0000-4000-8000-000000000001";
    await insertRecord(
      transaction,
      `INSERT INTO school_tareas
         (id, ciclo_lectivo_id, titulo, descripcion, fecha_entrega, materia_id, profesor_id)
       VALUES (:id, UNHEX(:cycleId), 'Actividad de bienvenida', 'Consigna ficticia para recorrer la demo.',
               CURRENT_TIMESTAMP + INTERVAL '7 days', UNHEX(:materiaId), UNHEX(:teacherId))
       ON CONFLICT (id) DO NOTHING`,
      { id: toBytes(taskId), cycleId, materiaId: mathSubject.materiaId, teacherId },
    );
    await insertRecord(
      transaction,
      `INSERT INTO school_entregas (id, tarea_id, alumno_id, archivo, nota, comentario)
       VALUES (:id, UNHEX(:taskId), UNHEX(:studentId), 'entrega-demo.txt', 9,
               'Entrega ficticia de ejemplo')
       ON CONFLICT (id) DO NOTHING`,
      {
        id: toBytes("40000000-0000-4000-8000-000000000002"),
        taskId,
        studentId: studentIds[0],
      },
    );
    await insertRecord(
      transaction,
      `INSERT INTO school_anuncios (id, profesor_id, materia_id, titulo, mensaje)
       VALUES (:id, UNHEX(:teacherId), UNHEX(:materiaId), 'Bienvenidos a la demo',
               'Este anuncio y todos los datos de esta cuenta son ficticios.')
       ON CONFLICT (id) DO NOTHING`,
      {
        id: toBytes("40000000-0000-4000-8000-000000000003"),
        teacherId,
        materiaId: languageSubject.materiaId,
      },
    );

    const attendanceDate = new Date().toISOString().slice(0, 10);
    for (let index = 0; index < studentIds.length; index += 1) {
      const studentId = studentIds[index];
      const status = index === 0 ? "presente" : "tarde";
      await insertRecord(
        transaction,
        `INSERT INTO school_asistencias (id, clase_id, alumno_id, fecha, estado, cargado_por)
         VALUES (:id, UNHEX(:claseId), UNHEX(:studentId), :attendanceDate, :status, UNHEX(:teacherId))
         ON CONFLICT (clase_id, alumno_id, fecha)
         DO UPDATE SET estado = EXCLUDED.estado, cargado_por = EXCLUDED.cargado_por`,
        {
          id: toBytes(randomUUID()),
          claseId: mathSubject.claseId,
          studentId,
          attendanceDate,
          status,
          teacherId,
        },
      );
      await insertRecord(
        transaction,
        `INSERT INTO school_asistencia_general
           (id, ciclo_lectivo_id, alumno_id, anio, division, fecha, estado, registrado_por)
         VALUES (:id, UNHEX(:cycleId), UNHEX(:studentId), 1, 'A', :attendanceDate, :status, UNHEX(:adminId))
         ON CONFLICT (alumno_id, fecha)
         DO UPDATE SET ciclo_lectivo_id = EXCLUDED.ciclo_lectivo_id, estado = EXCLUDED.estado,
           registrado_por = EXCLUDED.registrado_por`,
        {
          id: toBytes(randomUUID()),
          cycleId,
          studentId,
          attendanceDate,
          status,
          adminId,
        },
      );
    }
  });

  console.log("Datos ficticios de la demo cargados o conservados correctamente.");
} catch (error) {
  console.error("No se pudieron preparar los datos ficticios de la demo:", error);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
