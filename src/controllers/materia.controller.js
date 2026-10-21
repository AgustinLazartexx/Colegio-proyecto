import { randomUUID } from "node:crypto";
import { QueryTypes } from "sequelize";
import { databaseId, isDatabaseId, sequelize } from "../services/academicData.service.js";

const materiaSelect = `
  SELECT
    HEX(m.id) AS _id,
    m.nombre,
    m.descripcion,
    m.anio,
    m.division,
    m.isActive,
    HEX(m.profesor_id) AS profesorId,
    p.nombre AS profesorNombre,
    p.email AS profesorEmail
  FROM materias m
  LEFT JOIN users p ON p.id = m.profesor_id
`;

const toMateria = (row) => ({
  _id: row._id,
  id: row._id,
  nombre: row.nombre,
  descripcion: row.descripcion,
  anio: row.anio,
  division: row.division,
  isActive: Boolean(row.isActive),
  profesor: row.profesorId
    ? {
        _id: row.profesorId,
        id: row.profesorId,
        nombre: row.profesorNombre,
        email: row.profesorEmail,
      }
    : null,
});

const getValidatedTeacher = async (id) => {
  if (!id) return null;
  if (!isDatabaseId(id)) return false;
  const [teacher] = await sequelize.query(
    "SELECT HEX(id) AS id FROM users WHERE id = UNHEX(:id) AND rol = 'profesor' AND isActive = TRUE LIMIT 1",
    { replacements: { id: databaseId(id) }, type: QueryTypes.SELECT },
  );
  return teacher?.id ?? false;
};

const serverError = (res, message, error) => {
  console.error(`${message}:`, error);
  return res.status(500).json({ msg: message });
};

export const crearMateria = async (req, res) => {
  const { nombre, anio, division, profesor, descripcion } = req.body;
  const normalizedName = typeof nombre === "string" ? nombre.trim() : "";
  const normalizedDivision = typeof division === "string" ? division.trim().toUpperCase() : "";
  const year = Number(anio);

  if (!normalizedName || !Number.isInteger(year) || year < 0 || year > 6) {
    return res.status(400).json({ msg: "Nombre y año válido son obligatorios." });
  }
  if (year > 0 && !normalizedDivision) {
    return res.status(400).json({ msg: "La división es obligatoria para materias de curso." });
  }

  try {
    const teacherId = await getValidatedTeacher(profesor);
    if (teacherId === false) {
      return res.status(400).json({ msg: "El profesor seleccionado no existe o no está activo." });
    }

    const [existing] = await sequelize.query(
      `SELECT HEX(id) AS id FROM materias
       WHERE nombre = :nombre AND anio = :anio AND division <=> :division LIMIT 1`,
      {
        replacements: {
          nombre: normalizedName,
          anio: year,
          division: normalizedDivision || null,
        },
        type: QueryTypes.SELECT,
      },
    );
    if (existing) {
      return res.status(409).json({ msg: "La materia ya existe para ese año y división." });
    }

    const id = randomUUID().replaceAll("-", "").toUpperCase();
    await sequelize.query(
      `INSERT INTO materias (id, nombre, descripcion, anio, division, profesor_id)
       VALUES (UNHEX(:id), :nombre, :descripcion, :anio, :division, ${teacherId ? "UNHEX(:teacherId)" : "NULL"})`,
      {
        replacements: {
          id,
          nombre: normalizedName,
          descripcion: descripcion?.trim() || null,
          anio: year,
          division: normalizedDivision || null,
          ...(teacherId ? { teacherId: databaseId(teacherId) } : {}),
        },
      },
    );
    const [row] = await sequelize.query(
      `${materiaSelect} WHERE m.id = UNHEX(:id)`,
      { replacements: { id }, type: QueryTypes.SELECT },
    );
    return res.status(201).json(toMateria(row));
  } catch (error) {
    if (error.original?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msg: "La materia ya existe para ese año y división." });
    }
    return serverError(res, "Error al crear la materia.", error);
  }
};

export const obtenerMateriasFiltradas = async (req, res) => {
  const { anio, profesor, division, includeSuspended } = req.query;
  const conditions = [];
  const replacements = {};

  if (!(req.user.rol === "admin" && includeSuspended === "true")) {
    conditions.push("m.isActive = TRUE");
  }

  if (anio !== undefined) {
    const year = Number(anio);
    if (!Number.isInteger(year) || year < 0 || year > 6) {
      return res.status(400).json({ msg: "Filtro de año inválido." });
    }
    conditions.push("m.anio = :anio");
    replacements.anio = year;
  }
  if (division) {
    conditions.push("m.division = :division");
    replacements.division = String(division).trim().toUpperCase();
  }

  if (req.user.rol === "profesor") {
    conditions.push(`(
      m.profesor_id = UNHEX(:currentUserId)
      OR EXISTS (
        SELECT 1 FROM clases c
        JOIN clase_profesores cp ON cp.clase_id = c.id
        WHERE c.materia_id = m.id AND cp.profesor_id = UNHEX(:currentUserId)
      )
    )`);
    replacements.currentUserId = databaseId(req.user.id);
  } else if (req.user.rol === "alumno") {
    conditions.push("m.anio = :userYear AND m.division = :userDivision");
    replacements.userYear = req.user.anio;
    replacements.userDivision = req.user.division;
  } else if (profesor) {
    if (!isDatabaseId(profesor)) return res.status(400).json({ msg: "ID de profesor inválido." });
    conditions.push("m.profesor_id = UNHEX(:profesorId)");
    replacements.profesorId = databaseId(profesor);
  }

  try {
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await sequelize.query(
      `${materiaSelect} ${where} ORDER BY m.anio, m.division, m.nombre`,
      { replacements, type: QueryTypes.SELECT },
    );
    return res.json(rows.map(toMateria));
  } catch (error) {
    return serverError(res, "Error al obtener las materias.", error);
  }
};

export const obtenerMateria = async (req, res) => {
  if (!isDatabaseId(req.params.id)) return res.status(400).json({ msg: "ID de materia inválido." });
  try {
    const [row] = await sequelize.query(
      `${materiaSelect}
       WHERE m.id = UNHEX(:id) AND (m.isActive = TRUE OR :isAdmin = TRUE)
       LIMIT 1`,
      {
        replacements: {
          id: databaseId(req.params.id),
          isAdmin: req.user.rol === "admin",
        },
        type: QueryTypes.SELECT,
      },
    );
    if (!row) return res.status(404).json({ msg: "Materia no encontrada." });
    return res.json(toMateria(row));
  } catch (error) {
    return serverError(res, "Error al obtener la materia.", error);
  }
};

export const actualizarMateria = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de materia inválido." });

  const currentRows = await sequelize.query(
    `SELECT nombre, anio, division, HEX(profesor_id) AS profesorId, descripcion
     FROM materias WHERE id = UNHEX(:id) LIMIT 1`,
    { replacements: { id: databaseId(id) }, type: QueryTypes.SELECT },
  ).catch((error) => {
    console.error("Error al buscar la materia:", error);
    return null;
  });
  if (!currentRows) return res.status(500).json({ msg: "Error al actualizar la materia." });
  const current = currentRows[0];
  if (!current) return res.status(404).json({ msg: "Materia no encontrada." });

  const nombre = req.body.nombre === undefined ? current.nombre : String(req.body.nombre).trim();
  const anio = req.body.anio === undefined ? current.anio : Number(req.body.anio);
  const division = req.body.division === undefined
    ? current.division
    : String(req.body.division).trim().toUpperCase() || null;
  const descripcion = req.body.descripcion === undefined
    ? current.descripcion
    : String(req.body.descripcion).trim() || null;
  const professorProvided = Object.hasOwn(req.body, "profesor");

  if (!nombre || !Number.isInteger(anio) || anio < 0 || anio > 6 || (anio > 0 && !division)) {
    return res.status(400).json({ msg: "Nombre, año y división válidos son obligatorios." });
  }

  try {
    const teacherId = professorProvided
      ? await getValidatedTeacher(req.body.profesor)
      : current.profesorId;
    if (teacherId === false) {
      return res.status(400).json({ msg: "El profesor seleccionado no existe o no está activo." });
    }

    await sequelize.query(
      `UPDATE materias
       SET nombre = :nombre, descripcion = :descripcion, anio = :anio, division = :division,
           profesor_id = ${teacherId ? "UNHEX(:teacherId)" : "NULL"}
       WHERE id = UNHEX(:id)`,
      {
        replacements: {
          id: databaseId(id),
          nombre,
          descripcion,
          anio,
          division,
          ...(teacherId ? { teacherId: databaseId(teacherId) } : {}),
        },
      },
    );
    const [row] = await sequelize.query(
      `${materiaSelect} WHERE m.id = UNHEX(:id)`,
      { replacements: { id: databaseId(id) }, type: QueryTypes.SELECT },
    );
    return res.json({ msg: "Materia actualizada.", materia: toMateria(row) });
  } catch (error) {
    if (error.original?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msg: "Ya existe una materia con ese nombre, año y división." });
    }
    return serverError(res, "Error al actualizar la materia.", error);
  }
};

export const cambiarEstadoMateria = async (req, res) => {
  if (!isDatabaseId(req.params.id)) return res.status(400).json({ msg: "ID de materia inválido." });
  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ msg: "El estado de la materia es inválido." });
  }
  try {
    const [existing] = await sequelize.query(
      "SELECT id FROM materias WHERE id = UNHEX(:id) LIMIT 1",
      { replacements: { id: databaseId(req.params.id) }, type: QueryTypes.SELECT },
    );
    if (!existing) return res.status(404).json({ msg: "Materia no encontrada." });
    await sequelize.query(
      "UPDATE materias SET isActive = :isActive WHERE id = UNHEX(:id)",
      { replacements: { id: databaseId(req.params.id), isActive: req.body.isActive } },
    );
    const [row] = await sequelize.query(
      `${materiaSelect} WHERE m.id = UNHEX(:id)`,
      { replacements: { id: databaseId(req.params.id) }, type: QueryTypes.SELECT },
    );
    return res.json({ msg: req.body.isActive ? "Materia reactivada." : "Materia suspendida.", materia: toMateria(row) });
  } catch (error) {
    return serverError(res, "Error al cambiar el estado de la materia.", error);
  }
};

export const verAlumnosMateria = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de materia inválido." });
  try {
    const [materia] = await sequelize.query(
      "SELECT HEX(id) AS id, anio, division, isActive FROM materias WHERE id = UNHEX(:id) LIMIT 1",
      { replacements: { id: databaseId(id) }, type: QueryTypes.SELECT },
    );
    if (!materia) return res.status(404).json({ msg: "Materia no encontrada." });
    if (req.user.rol !== "admin" && !materia.isActive) {
      return res.status(404).json({ msg: "Materia no encontrada." });
    }

    if (req.user.rol === "profesor") {
      const [assigned] = await sequelize.query(
        `SELECT m.id FROM materias m
         WHERE m.id = UNHEX(:materiaId) AND (
           m.profesor_id = UNHEX(:profesorId)
           OR EXISTS (SELECT 1 FROM clases c JOIN clase_profesores cp ON cp.clase_id = c.id
                      WHERE c.materia_id = m.id AND cp.profesor_id = UNHEX(:profesorId))
         ) LIMIT 1`,
        {
          replacements: {
            materiaId: databaseId(id),
            profesorId: databaseId(req.user.id),
          },
          type: QueryTypes.SELECT,
        },
      );
      if (!assigned) return res.status(403).json({ msg: "No tienes asignada esta materia." });
    }

    let students = await sequelize.query(
      `SELECT DISTINCT HEX(u.id) AS _id, u.nombre, u.email, u.dni, u.anio, u.division
       FROM users u
       JOIN clase_alumnos ca ON ca.alumno_id = u.id
       JOIN clases c ON c.id = ca.clase_id
       WHERE c.materia_id = UNHEX(:id) AND u.rol = 'alumno'
       ORDER BY u.nombre`,
      { replacements: { id: databaseId(id) }, type: QueryTypes.SELECT },
    );

    if (!students.length) {
      students = await sequelize.query(
        `SELECT HEX(id) AS _id, nombre, email, dni, anio, division
         FROM users WHERE rol = 'alumno' AND anio = :anio AND division = :division
         ORDER BY nombre`,
        { replacements: { anio: materia.anio, division: materia.division }, type: QueryTypes.SELECT },
      );
    }
    return res.json(students);
  } catch (error) {
    return serverError(res, "Error al obtener alumnos de la materia.", error);
  }
};

export const inscribirseAMateria = async (_req, res) =>
  res.status(501).json({ msg: "Utilice la gestión de clases para inscribir alumnos." });

export const obtenerMateriasDelProfesor = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `${materiaSelect}
       WHERE m.isActive = TRUE
         AND (
           m.profesor_id = UNHEX(:profesorId)
           OR EXISTS (
            SELECT 1 FROM clases c JOIN clase_profesores cp ON cp.clase_id = c.id
            WHERE c.materia_id = m.id AND c.isActive = TRUE
              AND cp.profesor_id = UNHEX(:profesorId)
          )
         )
       ORDER BY m.anio, m.division, m.nombre`,
      {
        replacements: { profesorId: databaseId(req.user.id) },
        type: QueryTypes.SELECT,
      },
    );
    return res.json(rows.map(toMateria));
  } catch (error) {
    return serverError(res, "Error al obtener materias del profesor.", error);
  }
};

export const verAlumnosPorProfesor = async (_req, res) => res.json([]);

export const obtenerProfesores = async (_req, res) => {
  try {
    const teachers = await sequelize.query(
      `SELECT HEX(id) AS _id, nombre, email, rol
       FROM users WHERE rol = 'profesor' AND isActive = TRUE ORDER BY nombre`,
      { type: QueryTypes.SELECT },
    );
    return res.json(teachers);
  } catch (error) {
    return serverError(res, "Error al obtener los profesores.", error);
  }
};
