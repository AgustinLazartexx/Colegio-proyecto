import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { QueryTypes } from "sequelize";
import { DB_DIALECT, pool, sequelize } from "../config/mariadb.js";

const adminEmail = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
const userPassword = process.env.DEMO_USER_PASSWORD;
const demoSeedEnabled = process.env.DEMO_SEED_ENABLED === "true";

const toBytes = (uuid) => Buffer.from(uuid.replaceAll("-", ""), "hex");

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
      studentIds.push(await createUser(
        transaction,
        stableId,
        student,
        await bcrypt.hash(userPassword, 12),
      ));
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
           (id, materia_id, diaSemana, horaInicio, horaFin, duracion, aula, anio, division)
         VALUES (:id, UNHEX(:materiaId), :diaSemana, :horaInicio, :horaFin, 60, :aula, 1, 'A')
         ON CONFLICT (materia_id, diaSemana, horaInicio, anio, division) DO NOTHING`,
        {
          id: toBytes(randomUUID()),
          materiaId,
          ...subject,
        },
      );

      const claseId = await findId(
        transaction,
        `SELECT HEX(id) AS id FROM clases
         WHERE materia_id = UNHEX(:materiaId) AND diaSemana = :diaSemana
           AND horaInicio = :horaInicio AND anio = 1 AND division = 'A' LIMIT 1`,
        { materiaId, diaSemana: subject.diaSemana, horaInicio: subject.horaInicio },
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
          `INSERT INTO clase_alumnos (clase_id, alumno_id)
           VALUES (UNHEX(:claseId), UNHEX(:studentId))
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
           (id, materia_id, alumno_id, profesor_id, descripcion, nota)
         VALUES (:id, UNHEX(:materiaId), UNHEX(:studentId), UNHEX(:teacherId), 'Evaluacion de muestra', :nota)
         ON CONFLICT (id) DO NOTHING`,
        {
          id: toBytes(gradeId),
          materiaId: mathSubject.materiaId,
          studentId,
          teacherId,
          nota: grade,
        },
      );
      await insertRecord(
        transaction,
        `INSERT INTO school_notas_trimestrales
           (id, materia_id, alumno_id, trimestre, orientadora, proceso, integradora,
            promedio_ponderado, nota_final_trimestre, observacion)
         VALUES (:id, UNHEX(:materiaId), UNHEX(:studentId), 1, :nota, :nota, :nota,
                 :nota, :nota, 'Calificacion ficticia para demostracion')
         ON CONFLICT (materia_id, alumno_id, trimestre) DO NOTHING`,
        {
          id: toBytes(index === 0
            ? "30000000-0000-4000-8000-000000000003"
            : "30000000-0000-4000-8000-000000000004"),
          materiaId: mathSubject.materiaId,
          studentId,
          nota: grade,
        },
      );

      await insertRecord(
        transaction,
        `INSERT INTO school_cuotas (id, alumno_id, mes, anio, monto, estado, fecha_vencimiento)
         VALUES (:id, UNHEX(:studentId), CAST(EXTRACT(MONTH FROM CURRENT_DATE) AS INTEGER),
                 CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS INTEGER), 12500, 'pendiente', CURRENT_DATE + 10)
         ON CONFLICT (alumno_id, mes, anio) DO NOTHING`,
        {
          id: toBytes(index === 0
            ? "30000000-0000-4000-8000-000000000005"
            : "30000000-0000-4000-8000-000000000006"),
          studentId,
        },
      );
    }

    const taskId = "40000000-0000-4000-8000-000000000001";
    await insertRecord(
      transaction,
      `INSERT INTO school_tareas
         (id, titulo, descripcion, fecha_entrega, materia_id, profesor_id)
       VALUES (:id, 'Actividad de bienvenida', 'Consigna ficticia para recorrer la demo.',
               CURRENT_TIMESTAMP + INTERVAL '7 days', UNHEX(:materiaId), UNHEX(:teacherId))
       ON CONFLICT (id) DO NOTHING`,
      { id: toBytes(taskId), materiaId: mathSubject.materiaId, teacherId },
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
           (id, alumno_id, anio, division, fecha, estado, registrado_por)
         VALUES (:id, UNHEX(:studentId), 1, 'A', :attendanceDate, :status, UNHEX(:adminId))
         ON CONFLICT (alumno_id, fecha)
         DO UPDATE SET estado = EXCLUDED.estado, registrado_por = EXCLUDED.registrado_por`,
        {
          id: toBytes(randomUUID()),
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
