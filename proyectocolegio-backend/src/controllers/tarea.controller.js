import { randomUUID } from "node:crypto";
import {
  databaseId,
  executeSql,
  isDatabaseId,
  queryRows,
} from "../services/relationalData.service.js";

const tareaSelect = `SELECT HEX(t.id) AS _id, t.titulo, t.descripcion, t.fecha_entrega AS fechaEntrega,
  HEX(t.materia_id) AS materiaId, HEX(t.profesor_id) AS profesorId, t.archivo,
  t.createdAt, t.updatedAt, m.nombre AS materiaNombre, m.anio, m.division,
  u.nombre AS profesorNombre`;
const taskJoins = `FROM school_tareas t
  JOIN materias m ON m.id = t.materia_id
  JOIN users u ON u.id = t.profesor_id`;

const esProfesorMateria = async (materiaId, profesorId) => {
  const rows = await queryRows(
    `SELECT m.id FROM materias m
     LEFT JOIN clases c ON c.materia_id = m.id
     LEFT JOIN clase_profesores cp ON cp.clase_id = c.id AND cp.profesor_id = UNHEX(:profesorId)
     WHERE m.id = UNHEX(:materiaId) AND m.isActive = TRUE
       AND (m.profesor_id = UNHEX(:profesorId) OR (c.isActive = TRUE AND cp.profesor_id IS NOT NULL))
     LIMIT 1`,
    { materiaId: databaseId(materiaId), profesorId: databaseId(profesorId) },
  );
  return rows.length > 0;
};

const obtenerTarea = async (id) => {
  const rows = await queryRows(`${tareaSelect} ${taskJoins} WHERE t.id = UNHEX(:id) LIMIT 1`, {
    id: databaseId(id),
  });
  return rows[0] ?? null;
};

const formatearTarea = (row) => ({
  _id: row._id,
  titulo: row.titulo,
  descripcion: row.descripcion,
  fechaEntrega: row.fechaEntrega,
  materia: { _id: row.materiaId, nombre: row.materiaNombre, anio: row.anio, division: row.division },
  profesor: { _id: row.profesorId, nombre: row.profesorNombre },
  archivo: row.archivo,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const crearTarea = async (req, res) => {
  const { titulo, descripcion, fechaEntrega, materia } = req.body;
  const fecha = typeof fechaEntrega === "string" ? new Date(fechaEntrega) : null;
  if (!titulo?.trim() || !descripcion?.trim() || !isDatabaseId(materia) || !fecha || Number.isNaN(fecha.valueOf())) {
    return res.status(400).json({ msg: "Título, descripción, materia y fecha de entrega válida son obligatorios." });
  }
  try {
    if (!(await esProfesorMateria(materia, req.user.id))) {
      return res.status(403).json({ msg: "No puedes crear tareas en esta materia." });
    }
    const id = randomUUID().replaceAll("-", "").toUpperCase();
    await executeSql(
      `INSERT INTO school_tareas (id, titulo, descripcion, fecha_entrega, materia_id, profesor_id, archivo)
       VALUES (UNHEX(:id), :titulo, :descripcion, :fecha,
         UNHEX(:materiaId), UNHEX(:profesorId), :archivo)`,
      {
        id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha,
        materiaId: databaseId(materia),
        profesorId: databaseId(req.user.id),
        archivo: req.file?.filename ?? null,
      },
    );
    const rows = await queryRows(
      `${tareaSelect} ${taskJoins} WHERE t.id = UNHEX(:id) LIMIT 1`,
      { id },
    );
    return res.status(201).json({ msg: "Tarea creada con éxito.", tarea: formatearTarea(rows[0]) });
  } catch (error) {
    console.error("Error creando tarea:", error);
    return res.status(500).json({ msg: "Error al crear tarea." });
  }
};

export const obtenerTareasPorMateria = async (req, res) => {
  const { materiaId } = req.params;
  if (!isDatabaseId(materiaId)) return res.status(400).json({ msg: "ID de materia inválido." });
  try {
    if (req.user.rol === "alumno") {
      const enrolled = await queryRows(
        `SELECT 1 AS ok FROM clase_alumnos ca
         JOIN clases c ON c.id = ca.clase_id
         JOIN materias m ON m.id = c.materia_id
         WHERE c.materia_id = UNHEX(:materiaId) AND c.isActive = TRUE
           AND m.isActive = TRUE AND ca.alumno_id = UNHEX(:userId) LIMIT 1`,
        { materiaId: databaseId(materiaId), userId: databaseId(req.user.id) },
      );
      if (!enrolled.length) return res.status(403).json({ msg: "No estás inscripto en esta materia." });
    } else if (req.user.rol === "profesor" && !(await esProfesorMateria(materiaId, req.user.id))) {
      return res.status(403).json({ msg: "No tienes acceso a esta materia." });
    }
    const rows = await queryRows(
      `${tareaSelect} ${taskJoins} WHERE t.materia_id = UNHEX(:materiaId) ORDER BY t.fecha_entrega`,
      { materiaId: databaseId(materiaId) },
    );
    return res.json(rows.map(formatearTarea));
  } catch (error) {
    console.error("Error consultando tareas de materia:", error);
    return res.status(500).json({ msg: "Error al obtener las tareas." });
  }
};

export const obtenerTareasPorClase = async (req, res) => {
  const { claseId } = req.params;
  if (!isDatabaseId(claseId)) return res.status(400).json({ msg: "ID de clase inválido." });
  try {
    const clase = await queryRows(
      `SELECT HEX(materia_id) AS materiaId FROM clases
       WHERE id = UNHEX(:claseId) AND isActive = TRUE LIMIT 1`,
      { claseId: databaseId(claseId) },
    );
    if (!clase.length) return res.status(404).json({ msg: "Clase no encontrada." });
    req.params.materiaId = clase[0].materiaId;
    return obtenerTareasPorMateria(req, res);
  } catch (error) {
    console.error("Error consultando tareas de clase:", error);
    return res.status(500).json({ msg: "Error al obtener las tareas." });
  }
};

export const obtenerTareasByProfesor = async (req, res) => {
  const profesorId = req.params.profesorId || req.user.id;
  if (!isDatabaseId(profesorId)) return res.status(400).json({ msg: "ID de profesor inválido." });
  if (req.user.rol !== "admin" && databaseId(req.user.id) !== databaseId(profesorId)) {
    return res.status(403).json({ msg: "No tienes autorización." });
  }
  try {
    const rows = await queryRows(
      `${tareaSelect} ${taskJoins} WHERE t.profesor_id = UNHEX(:profesorId) ORDER BY t.createdAt DESC`,
      { profesorId: databaseId(profesorId) },
    );
    return res.json(rows.map(formatearTarea));
  } catch (error) {
    console.error("Error consultando tareas del profesor:", error);
    return res.status(500).json({ msg: "Error al obtener las tareas." });
  }
};

export const eliminarTarea = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de tarea inválido." });
  try {
    const task = await obtenerTarea(id);
    if (!task) return res.status(404).json({ msg: "Tarea no encontrada." });
    if (req.user.rol !== "admin" && task.profesorId !== databaseId(req.user.id)) {
      return res.status(403).json({ msg: "No tienes autorización para eliminar esta tarea." });
    }
    await executeSql("DELETE FROM school_tareas WHERE id = UNHEX(:id)", { id: databaseId(id) });
    return res.json({ msg: "Tarea eliminada." });
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    return res.status(500).json({ msg: "Error al eliminar la tarea." });
  }
};
