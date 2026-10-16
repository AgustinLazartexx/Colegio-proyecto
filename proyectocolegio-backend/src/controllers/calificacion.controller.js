import {
  databaseId,
  executeSql,
  isDatabaseId,
  queryRows,
} from "../services/relationalData.service.js";

const calificacionSelect = `SELECT HEX(c.id) AS _id, HEX(c.materia_id) AS materiaId,
  HEX(c.alumno_id) AS alumnoId, HEX(c.profesor_id) AS profesorId, c.descripcion, c.nota,
  c.createdAt, c.updatedAt, u.nombre AS alumnoNombre, u.email AS alumnoEmail,
  m.nombre AS materiaNombre, m.anio, m.division
  FROM school_calificaciones c
  JOIN users u ON u.id = c.alumno_id
  JOIN materias m ON m.id = c.materia_id`;

const asignadaAlProfesor = async (materiaId, profesorId) => {
  const rows = await queryRows(
    `SELECT m.id FROM materias m
     LEFT JOIN clases c ON c.materia_id = m.id
     LEFT JOIN clase_profesores cp ON cp.clase_id = c.id AND cp.profesor_id = UNHEX(:profesorId)
     WHERE m.id = UNHEX(:materiaId)
       AND (m.profesor_id = UNHEX(:profesorId) OR cp.profesor_id IS NOT NULL)
     LIMIT 1`,
    { materiaId: databaseId(materiaId), profesorId: databaseId(profesorId) },
  );
  return rows.length > 0;
};

export const crearCalificacion = async (req, res) => {
  const { materia, alumno, descripcion, nota } = req.body;
  const grade = Number(nota);
  if (!isDatabaseId(materia) || !isDatabaseId(alumno) || !descripcion?.trim() ||
      !Number.isFinite(grade) || grade < 1 || grade > 10) {
    return res.status(400).json({ msg: "Materia, alumno, descripción y nota válida son obligatorios." });
  }
  try {
    if (!(await asignadaAlProfesor(materia, req.user.id))) {
      return res.status(403).json({ msg: "No tienes acceso a esta materia." });
    }
    const enrolled = await queryRows(
      `SELECT 1 AS ok FROM clase_alumnos ca JOIN clases c ON c.id = ca.clase_id
       WHERE c.materia_id = UNHEX(:materiaId) AND ca.alumno_id = UNHEX(:alumnoId) LIMIT 1`,
      { materiaId: databaseId(materia), alumnoId: databaseId(alumno) },
    );
    if (!enrolled.length) return res.status(400).json({ msg: "El alumno no está inscripto en esta materia." });
    await executeSql(
      `INSERT INTO school_calificaciones (id, materia_id, alumno_id, profesor_id, descripcion, nota)
       VALUES (UNHEX(REPLACE(UUID(), '-', '')), UNHEX(:materiaId), UNHEX(:alumnoId),
         UNHEX(:profesorId), :descripcion, :nota)`,
      {
        materiaId: databaseId(materia),
        alumnoId: databaseId(alumno),
        profesorId: databaseId(req.user.id),
        descripcion: descripcion.trim(),
        nota: grade,
      },
    );
    const [calificacion] = await queryRows(
      `${calificacionSelect} WHERE c.materia_id = UNHEX(:materiaId) AND c.alumno_id = UNHEX(:alumnoId)
       ORDER BY c.createdAt DESC LIMIT 1`,
      { materiaId: databaseId(materia), alumnoId: databaseId(alumno) },
    );
    return res.status(201).json(calificacion);
  } catch (error) {
    console.error("Error creando calificación:", error);
    return res.status(500).json({ msg: "Error al crear calificación." });
  }
};

export const obtenerCalificacionesPorMateria = async (req, res) => {
  const { idMateria } = req.params;
  if (!isDatabaseId(idMateria)) return res.status(400).json({ msg: "ID de materia inválido." });
  try {
    if (!(await asignadaAlProfesor(idMateria, req.user.id))) {
      return res.status(403).json({ msg: "No autorizado para esta materia." });
    }
    const rows = await queryRows(
      `${calificacionSelect} WHERE c.materia_id = UNHEX(:materiaId) ORDER BY c.createdAt DESC`,
      { materiaId: databaseId(idMateria) },
    );
    return res.json(rows.map((row) => ({
      _id: row._id,
      materia: { _id: row.materiaId, nombre: row.materiaNombre, anio: row.anio, division: row.division },
      alumno: { _id: row.alumnoId, nombre: row.alumnoNombre, email: row.alumnoEmail },
      profesor: row.profesorId,
      descripcion: row.descripcion,
      nota: Number(row.nota),
      createdAt: row.createdAt,
    })));
  } catch (error) {
    console.error("Error consultando calificaciones de materia:", error);
    return res.status(500).json({ msg: "Error al obtener calificaciones." });
  }
};

export const obtenerCalificacionesAlumno = async (req, res) => {
  try {
    const rows = await queryRows(
      `${calificacionSelect} WHERE c.alumno_id = UNHEX(:alumnoId) ORDER BY c.createdAt DESC`,
      { alumnoId: databaseId(req.user.id) },
    );
    return res.json(rows.map((row) => ({
      _id: row._id,
      materia: { _id: row.materiaId, nombre: row.materiaNombre, anio: row.anio, division: row.division },
      alumno: { _id: row.alumnoId, nombre: row.alumnoNombre },
      descripcion: row.descripcion,
      nota: Number(row.nota),
      createdAt: row.createdAt,
    })));
  } catch (error) {
    console.error("Error consultando calificaciones del alumno:", error);
    return res.status(500).json({ msg: "Error al obtener tus calificaciones." });
  }
};

const findCalificacion = async (id) => {
  const rows = await queryRows(
    `${calificacionSelect} WHERE c.id = UNHEX(:id) LIMIT 1`,
    { id: databaseId(id) },
  );
  return rows[0] ?? null;
};

export const actualizarCalificacion = async (req, res) => {
  const { id } = req.params;
  const grade = Number(req.body.nota);
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de calificación inválido." });
  if (!Number.isFinite(grade) || grade < 1 || grade > 10) return res.status(400).json({ msg: "La nota debe estar entre 1 y 10." });
  try {
    const calificacion = await findCalificacion(id);
    if (!calificacion) return res.status(404).json({ msg: "Calificación no encontrada." });
    if (req.user.rol !== "admin" && calificacion.profesorId !== databaseId(req.user.id)) {
      return res.status(403).json({ msg: "Acceso denegado." });
    }
    await executeSql("UPDATE school_calificaciones SET nota = :nota WHERE id = UNHEX(:id)", { nota: grade, id: databaseId(id) });
    return res.json({ msg: "Calificación actualizada.", calificacion: { ...calificacion, nota: grade } });
  } catch (error) {
    console.error("Error actualizando calificación:", error);
    return res.status(500).json({ msg: "Error al actualizar la calificación." });
  }
};

export const eliminarCalificacion = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de calificación inválido." });
  try {
    const calificacion = await findCalificacion(id);
    if (!calificacion) return res.status(404).json({ msg: "Calificación no encontrada." });
    if (req.user.rol !== "admin" && calificacion.profesorId !== databaseId(req.user.id)) {
      return res.status(403).json({ msg: "Acceso denegado." });
    }
    await executeSql("DELETE FROM school_calificaciones WHERE id = UNHEX(:id)", { id: databaseId(id) });
    return res.json({ msg: "Calificación eliminada." });
  } catch (error) {
    console.error("Error eliminando calificación:", error);
    return res.status(500).json({ msg: "Error al eliminar la calificación." });
  }
};
