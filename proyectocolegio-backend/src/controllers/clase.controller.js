import { randomUUID } from "node:crypto";
import { QueryTypes } from "sequelize";
import { databaseId, isDatabaseId, sequelize } from "../services/academicData.service.js";

const validDays = new Set(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]);
const validId = (id) => typeof id === "string" && /^[\da-f]{32}$/i.test(String(id).replaceAll("-", ""));

const classSelect = `
  SELECT
    HEX(c.id) AS _id,
    HEX(c.id) AS id,
    c.anio,
    c.division,
    c.diaSemana,
    TIME_FORMAT(c.horaInicio, '%H:%i') AS horaInicio,
    TIME_FORMAT(c.horaFin, '%H:%i') AS horaFin,
    c.aula,
    HEX(m.id) AS materiaId,
    m.nombre AS materiaNombre,
    m.anio AS materiaAnio,
    m.division AS materiaDivision,
    HEX(mp.id) AS materiaProfesorId,
    mp.nombre AS materiaProfesorNombre,
    mp.email AS materiaProfesorEmail,
    HEX(p.id) AS profesorId,
    p.nombre AS profesorNombre,
    p.email AS profesorEmail
  FROM clases c
  JOIN materias m ON m.id = c.materia_id
  LEFT JOIN users mp ON mp.id = m.profesor_id
  LEFT JOIN clase_profesores cp ON cp.clase_id = c.id
  LEFT JOIN users p ON p.id = cp.profesor_id
`;

const formatClasses = (rows) => {
  const classes = new Map();
  for (const row of rows) {
    let current = classes.get(row._id);
    if (!current) {
      current = {
        _id: row._id,
        id: row.id,
        anio: row.anio,
        division: row.division,
        diaSemana: row.diaSemana,
        dia: row.diaSemana,
        horaInicio: row.horaInicio,
        horaFin: row.horaFin,
        horarioInicio: row.horaInicio,
        horarioFin: row.horaFin,
        horario: `${row.horaInicio} - ${row.horaFin}`,
        aula: row.aula,
        materia: {
          _id: row.materiaId,
          id: row.materiaId,
          nombre: row.materiaNombre,
          anio: row.materiaAnio,
          division: row.materiaDivision,
          profesor: row.materiaProfesorId
            ? {
                _id: row.materiaProfesorId,
                id: row.materiaProfesorId,
                nombre: row.materiaProfesorNombre,
                email: row.materiaProfesorEmail,
              }
            : null,
        },
        profesores: [],
      };
      classes.set(row._id, current);
    }
    if (row.profesorId && !current.profesores.some((teacher) => teacher._id === row.profesorId)) {
      current.profesores.push({
        _id: row.profesorId,
        id: row.profesorId,
        nombre: row.profesorNombre,
        email: row.profesorEmail,
      });
    }
  }
  return [...classes.values()];
};

const getClasses = async ({ filters = [], replacements = {}, orderBy = "c.anio, c.division, c.diaSemana, c.horaInicio" } = {}) => {
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = await sequelize.query(
    `${classSelect} ${where} ORDER BY ${orderBy}`,
    { replacements, type: QueryTypes.SELECT },
  );
  return formatClasses(rows);
};

const validateTime = (time) =>
  typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

const normalizeTeachers = (teacherIds) => {
  if (!Array.isArray(teacherIds) || !teacherIds.length) return null;
  const uniqueIds = [...new Set(teacherIds.map((id) => String(id)))];
  if (uniqueIds.some((id) => !isDatabaseId(id))) return null;
  return uniqueIds.map(databaseId);
};

const getTeacherIds = async (teacherIds, transaction) => {
  const replacements = {};
  const placeholders = teacherIds.map((id, index) => {
    const key = `teacher${index}`;
    replacements[key] = id;
    return `UNHEX(:${key})`;
  });
  const teachers = await sequelize.query(
    `SELECT HEX(id) AS id FROM users
     WHERE id IN (${placeholders.join(", ")}) AND rol = 'profesor' AND isActive = TRUE`,
    { replacements, type: QueryTypes.SELECT, transaction },
  );
  return teachers.length === teacherIds.length;
};

const getConflict = async ({ teacherIds, diaSemana, horaInicio, horaFin, excludeId, transaction }) => {
  if (!teacherIds.length) return null;
  const replacements = { diaSemana, horaInicio, horaFin };
  const teacherParameters = teacherIds.map((id, index) => {
    const key = `teacher${index}`;
    replacements[key] = id;
    return `UNHEX(:${key})`;
  });
  const excludeClause = excludeId ? "AND c.id <> UNHEX(:excludeId)" : "";
  if (excludeId) replacements.excludeId = databaseId(excludeId);

  const [conflict] = await sequelize.query(
    `SELECT c.diaSemana, TIME_FORMAT(c.horaInicio, '%H:%i') AS horaInicio,
            TIME_FORMAT(c.horaFin, '%H:%i') AS horaFin, u.nombre AS profesorNombre
     FROM clases c
     JOIN clase_profesores cp ON cp.clase_id = c.id
     JOIN users u ON u.id = cp.profesor_id
     WHERE c.diaSemana = :diaSemana
       AND c.horaInicio < :horaFin AND c.horaFin > :horaInicio
       AND cp.profesor_id IN (${teacherParameters.join(", ")})
       ${excludeClause}
     LIMIT 1`,
    { replacements, type: QueryTypes.SELECT, transaction },
  );
  return conflict ?? null;
};

const getClassId = (id) => {
  if (!validId(id)) return null;
  return databaseId(id);
};

const findClassById = async (id, transaction) => {
  const classes = await getClasses({
    filters: ["c.id = UNHEX(:id)"],
    replacements: { id: databaseId(id) },
    orderBy: "c.diaSemana, c.horaInicio",
  });
  return classes[0] ?? null;
};

export const obtenerClasePorId = async (req, res) => {
  const id = getClassId(req.params.claseId);
  if (!id) return res.status(400).json({ msg: "ID de clase inválido." });
  try {
    const clase = await findClassById(id);
    if (!clase) return res.status(404).json({ msg: "Clase no encontrada." });
    return res.json(clase);
  } catch (error) {
    console.error("Error al obtener clase:", error);
    return res.status(500).json({ msg: "Error al obtener la clase." });
  }
};

export const crearClase = async (req, res) => {
  const { materia, profesores, diaSemana, horaInicio, horaFin, aula } = req.body;
  const materiaId = getClassId(materia);
  const teacherIds = normalizeTeachers(profesores);

  if (!materiaId || !teacherIds || !validDays.has(diaSemana) || !validateTime(horaInicio) || !validateTime(horaFin)) {
    return res.status(400).json({
      msg: "Materia, profesores, día y horarios válidos son obligatorios.",
    });
  }
  if (horaInicio >= horaFin) {
    return res.status(400).json({ msg: "La hora de inicio debe ser anterior a la hora de fin." });
  }

  const classId = randomUUID().replaceAll("-", "").toUpperCase();
  try {
    await sequelize.transaction(async (transaction) => {
      const [subject] = await sequelize.query(
        `SELECT anio, division FROM materias WHERE id = UNHEX(:materiaId) LIMIT 1`,
        { replacements: { materiaId }, type: QueryTypes.SELECT, transaction },
      );
      if (!subject) {
        const error = new Error("MATERIA_NOT_FOUND");
        throw error;
      }
      if (subject.anio == null || !subject.division) {
        const error = new Error("MATERIA_COURSE_REQUIRED");
        throw error;
      }
      if (!(await getTeacherIds(teacherIds, transaction))) {
        const error = new Error("INVALID_TEACHER");
        throw error;
      }

      const conflict = await getConflict({
        teacherIds,
        diaSemana,
        horaInicio,
        horaFin,
        transaction,
      });
      if (conflict) {
        const error = new Error("SCHEDULE_CONFLICT");
        error.conflict = conflict;
        throw error;
      }

      await sequelize.query(
        `INSERT INTO clases
          (id, materia_id, diaSemana, horaInicio, horaFin, aula, anio, division)
         VALUES (UNHEX(:classId), UNHEX(:materiaId), :diaSemana, :horaInicio, :horaFin, :aula, :anio, :division)`,
        {
          replacements: {
            classId,
            materiaId,
            diaSemana,
            horaInicio,
            horaFin,
            aula: typeof aula === "string" ? aula.trim() || null : null,
            anio: subject.anio,
            division: subject.division,
          },
          transaction,
        },
      );

      for (const profesorId of teacherIds) {
        await sequelize.query(
          `INSERT INTO clase_profesores (clase_id, profesor_id)
           VALUES (UNHEX(:classId), UNHEX(:profesorId))`,
          { replacements: { classId, profesorId }, transaction },
        );
      }
    });

    const clase = await findClassById(classId);
    return res.status(201).json({ msg: "Clase creada correctamente.", clase });
  } catch (error) {
    if (error.message === "MATERIA_NOT_FOUND") return res.status(404).json({ msg: "Materia no encontrada." });
    if (error.message === "MATERIA_COURSE_REQUIRED") {
      return res.status(400).json({ msg: "La materia seleccionada no tiene año o división definidos." });
    }
    if (error.message === "INVALID_TEACHER") {
      return res.status(400).json({ msg: "Uno o más profesores no existen o no están activos." });
    }
    if (error.message === "SCHEDULE_CONFLICT") {
      return res.status(409).json({
        msg: `Conflicto de horario: ${error.conflict.profesorNombre} ya tiene una clase en ese horario.`,
      });
    }
    if (error.original?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msg: "Ya existe una clase para esa materia, curso y horario." });
    }
    console.error("Error al crear clase:", error);
    return res.status(500).json({ msg: "Error interno al crear la clase." });
  }
};

export const obtenerTodasLasClases = async (req, res) => {
  const { anio, materia, profesor, division, diaSemana } = req.query;
  const filters = [];
  const replacements = {};

  if (anio) {
    const year = Number(anio);
    if (!Number.isInteger(year) || year < 1 || year > 6) return res.status(400).json({ msg: "Filtro de año inválido." });
    filters.push("c.anio = :anio");
    replacements.anio = year;
  }
  if (materia) {
    if (!validId(materia)) return res.status(400).json({ msg: "ID de materia inválido." });
    filters.push("c.materia_id = UNHEX(:materiaId)");
    replacements.materiaId = databaseId(materia);
  }
  if (profesor) {
    if (!validId(profesor)) return res.status(400).json({ msg: "ID de profesor inválido." });
    filters.push("EXISTS (SELECT 1 FROM clase_profesores cp_filter WHERE cp_filter.clase_id = c.id AND cp_filter.profesor_id = UNHEX(:profesorId))");
    replacements.profesorId = databaseId(profesor);
  }
  if (division) {
    filters.push("c.division = :division");
    replacements.division = String(division).trim().toUpperCase();
  }
  if (diaSemana) {
    if (!validDays.has(diaSemana)) return res.status(400).json({ msg: "Filtro de día inválido." });
    filters.push("c.diaSemana = :diaSemana");
    replacements.diaSemana = diaSemana;
  }

  try {
    const classes = await getClasses({ filters, replacements });
    return res.json({
      msg: "Clases obtenidas correctamente.",
      clases: classes,
      total: classes.length,
    });
  } catch (error) {
    console.error("Error al obtener clases:", error);
    return res.status(500).json({ msg: "Error al obtener las clases." });
  }
};

export const obtenerClasesProfesor = async (req, res) => {
  try {
    const classes = await getClasses({
      filters: ["EXISTS (SELECT 1 FROM clase_profesores cp_filter WHERE cp_filter.clase_id = c.id AND cp_filter.profesor_id = UNHEX(:profesorId))"],
      replacements: { profesorId: databaseId(req.user.id) },
      orderBy: "c.diaSemana, c.horaInicio",
    });
    return res.json({
      msg: "Clases obtenidas correctamente.",
      clases: classes,
      total: classes.length,
      profesor: { id: req.user.id, nombre: req.user.nombre },
    });
  } catch (error) {
    console.error("Error al obtener clases del profesor:", error);
    return res.status(500).json({ msg: "Error al obtener las clases del profesor." });
  }
};

export const actualizarClase = async (req, res) => {
  const id = getClassId(req.params.id);
  if (!id) return res.status(400).json({ msg: "ID de clase inválido." });

  try {
    const current = await findClassById(id);
    if (!current) return res.status(404).json({ msg: "Clase no encontrada." });

    const diaSemana = req.body.diaSemana ?? current.diaSemana;
    const horaInicio = req.body.horaInicio ?? current.horaInicio;
    const horaFin = req.body.horaFin ?? current.horaFin;
    const aula = req.body.aula === undefined ? current.aula : String(req.body.aula).trim() || null;
    const teacherIds = req.body.profesores === undefined
      ? current.profesores.map((teacher) => databaseId(teacher._id))
      : normalizeTeachers(req.body.profesores);

    if (!validDays.has(diaSemana) || !validateTime(horaInicio) || !validateTime(horaFin) || !teacherIds) {
      return res.status(400).json({ msg: "Día, horarios o profesores inválidos." });
    }
    if (horaInicio >= horaFin) {
      return res.status(400).json({ msg: "La hora de inicio debe ser anterior a la hora de fin." });
    }

    await sequelize.transaction(async (transaction) => {
      if (!(await getTeacherIds(teacherIds, transaction))) {
        const error = new Error("INVALID_TEACHER");
        throw error;
      }
      const conflict = await getConflict({
        teacherIds,
        diaSemana,
        horaInicio,
        horaFin,
        excludeId: id,
        transaction,
      });
      if (conflict) {
        const error = new Error("SCHEDULE_CONFLICT");
        error.conflict = conflict;
        throw error;
      }

      await sequelize.query(
        `UPDATE clases
         SET diaSemana = :diaSemana, horaInicio = :horaInicio, horaFin = :horaFin, aula = :aula
         WHERE id = UNHEX(:id)`,
        { replacements: { id, diaSemana, horaInicio, horaFin, aula }, transaction },
      );
      await sequelize.query(
        "DELETE FROM clase_profesores WHERE clase_id = UNHEX(:id)",
        { replacements: { id }, transaction },
      );
      for (const profesorId of teacherIds) {
        await sequelize.query(
          `INSERT INTO clase_profesores (clase_id, profesor_id)
           VALUES (UNHEX(:id), UNHEX(:profesorId))`,
          { replacements: { id, profesorId }, transaction },
        );
      }
    });

    return res.json({
      msg: "Clase actualizada correctamente.",
      clase: await findClassById(id),
    });
  } catch (error) {
    if (error.message === "INVALID_TEACHER") return res.status(400).json({ msg: "Uno o más profesores no existen o no están activos." });
    if (error.message === "SCHEDULE_CONFLICT") {
      return res.status(409).json({ msg: `Conflicto de horario: ${error.conflict.profesorNombre} ya tiene clase en ese horario.` });
    }
    console.error("Error al actualizar clase:", error);
    return res.status(500).json({ msg: "Error al actualizar la clase." });
  }
};

export const eliminarClase = async (req, res) => {
  const id = getClassId(req.params.id);
  if (!id) return res.status(400).json({ msg: "ID de clase inválido." });
  try {
    const [result] = await sequelize.query(
      "DELETE FROM clases WHERE id = UNHEX(:id)",
      { replacements: { id } },
    );
    if (!result.affectedRows) return res.status(404).json({ msg: "Clase no encontrada." });
    return res.json({ msg: "Clase eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar clase:", error);
    return res.status(500).json({ msg: "Error al eliminar la clase." });
  }
};

export const asignarAlumno = async (req, res) => {
  const id = getClassId(req.params.id);
  const alumnoId = getClassId(req.body.alumnoId);
  if (!id || !alumnoId) return res.status(400).json({ msg: "ID de clase o alumno inválido." });

  try {
    const clase = await findClassById(id);
    if (!clase) return res.status(404).json({ msg: "Clase no encontrada." });
    const [student] = await sequelize.query(
      `SELECT HEX(id) AS id, anio, division FROM users
       WHERE id = UNHEX(:alumnoId) AND rol = 'alumno' AND isActive = TRUE LIMIT 1`,
      { replacements: { alumnoId }, type: QueryTypes.SELECT },
    );
    if (!student) return res.status(404).json({ msg: "Alumno no encontrado o inactivo." });
    if (Number(student.anio) !== Number(clase.anio) || student.division !== clase.division) {
      return res.status(400).json({ msg: "El alumno no pertenece al año y división de esta clase." });
    }

    const [result] = await sequelize.query(
      `INSERT IGNORE INTO clase_alumnos (clase_id, alumno_id)
       VALUES (UNHEX(:id), UNHEX(:alumnoId))`,
      { replacements: { id, alumnoId } },
    );
    if (!result.affectedRows) return res.status(409).json({ msg: "El alumno ya está inscrito en esta clase." });
    return res.status(201).json({ msg: "Alumno inscrito correctamente." });
  } catch (error) {
    console.error("Error al asignar alumno a clase:", error);
    return res.status(500).json({ msg: "Error al asignar el alumno a la clase." });
  }
};

export const desasignarAlumno = async (req, res) => {
  const id = getClassId(req.params.id);
  const alumnoId = getClassId(req.params.alumnoId);
  if (!id || !alumnoId) return res.status(400).json({ msg: "ID de clase o alumno inválido." });
  try {
    const [result] = await sequelize.query(
      "DELETE FROM clase_alumnos WHERE clase_id = UNHEX(:id) AND alumno_id = UNHEX(:alumnoId)",
      { replacements: { id, alumnoId } },
    );
    if (!result.affectedRows) return res.status(404).json({ msg: "El alumno no estaba inscrito en esa clase." });
    return res.json({ msg: "Alumno eliminado de la clase." });
  } catch (error) {
    console.error("Error al quitar alumno de clase:", error);
    return res.status(500).json({ msg: "Error al quitar el alumno de la clase." });
  }
};

export const listarAlumnosDeClase = async (req, res) => {
  const id = getClassId(req.params.id);
  if (!id) return res.status(400).json({ msg: "ID de clase inválido." });
  try {
    const [clase] = await sequelize.query(
      "SELECT id FROM clases WHERE id = UNHEX(:id) LIMIT 1",
      { replacements: { id }, type: QueryTypes.SELECT },
    );
    if (!clase) return res.status(404).json({ msg: "Clase no encontrada." });

    const students = await sequelize.query(
      `SELECT HEX(u.id) AS _id, u.nombre, u.email, u.dni, u.anio, u.division
       FROM users u
       JOIN clase_alumnos ca ON ca.alumno_id = u.id
       WHERE ca.clase_id = UNHEX(:id) AND u.rol = 'alumno'
       ORDER BY u.nombre`,
      { replacements: { id }, type: QueryTypes.SELECT },
    );
    return res.json(students);
  } catch (error) {
    console.error("Error al listar alumnos de clase:", error);
    return res.status(500).json({ msg: "Error al listar los alumnos de la clase." });
  }
};

export const getMisClasesAlumno = async (req, res) => {
  if (req.user.rol !== "alumno") {
    return res.status(403).json({ msg: "Esta consulta es solo para alumnos." });
  }
  try {
    const classes = await getClasses({
      filters: [
        "EXISTS (SELECT 1 FROM clase_alumnos ca_filter WHERE ca_filter.clase_id = c.id AND ca_filter.alumno_id = UNHEX(:alumnoId))",
      ],
      replacements: { alumnoId: databaseId(req.user.id) },
      orderBy: "c.diaSemana, c.horaInicio",
    });
    return res.json(classes);
  } catch (error) {
    console.error("Error al obtener clases del alumno:", error);
    return res.status(500).json({ msg: "Error al obtener el cronograma del alumno." });
  }
};
