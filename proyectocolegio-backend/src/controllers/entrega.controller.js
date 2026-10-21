import { randomUUID } from "node:crypto";
import {
  databaseId,
  executeSql,
  isDatabaseId,
  queryRows,
} from "../services/relationalData.service.js";

const entregaSelect = `SELECT HEX(e.id) AS _id, HEX(e.tarea_id) AS tareaId,
  HEX(e.alumno_id) AS alumnoId, e.archivo, e.fecha_entrega AS fechaEntrega,
  e.nota, e.comentario, e.fecha_correccion AS fechaCorreccion, e.createdAt, e.updatedAt,
  a.nombre AS alumnoNombre, a.email AS alumnoEmail,
  HEX(t.profesor_id) AS profesorId, t.titulo AS tareaTitulo, t.descripcion AS tareaDescripcion,
  t.fecha_entrega AS tareaFechaEntrega, HEX(t.materia_id) AS materiaId, m.nombre AS materiaNombre`;
const entregaJoins = `FROM school_entregas e
  JOIN users a ON a.id = e.alumno_id
  JOIN school_tareas t ON t.id = e.tarea_id
  JOIN materias m ON m.id = t.materia_id`;

const formatearEntrega = (row) => ({
  _id: row._id,
  tarea: {
    _id: row.tareaId,
    titulo: row.tareaTitulo,
    descripcion: row.tareaDescripcion,
    fechaEntrega: row.tareaFechaEntrega,
    materia: { _id: row.materiaId, nombre: row.materiaNombre },
  },
  alumno: { _id: row.alumnoId, nombre: row.alumnoNombre, email: row.alumnoEmail },
  archivo: row.archivo,
  fechaEntrega: row.fechaEntrega,
  nota: row.nota === null ? null : Number(row.nota),
  comentario: row.comentario,
  fechaCorreccion: row.fechaCorreccion,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const subirEntrega = async (req, res) => {
  const tareaId = req.body.tareaId || req.body.tarea;
  if (!isDatabaseId(tareaId)) return res.status(400).json({ msg: "ID de tarea inválido." });
  if (!req.file) return res.status(400).json({ msg: "No se ha subido ningún archivo." });
  try {
    const tareas = await queryRows(
      `SELECT HEX(t.id) AS id, HEX(t.materia_id) AS materiaId
       FROM school_tareas t
       JOIN materias m ON m.id = t.materia_id
       WHERE t.id = UNHEX(:tareaId) AND m.isActive = TRUE LIMIT 1`,
      { tareaId: databaseId(tareaId) },
    );
    if (!tareas.length) return res.status(404).json({ msg: "La tarea no existe." });
    const inscrito = await queryRows(
      `SELECT 1 AS ok FROM clases c
       JOIN materias m ON m.id = c.materia_id
       JOIN clase_alumnos ca ON ca.clase_id = c.id
       WHERE c.materia_id = UNHEX(:materiaId) AND c.isActive = TRUE AND m.isActive = TRUE
         AND ca.alumno_id = UNHEX(:alumnoId) LIMIT 1`,
      { materiaId: tareas[0].materiaId, alumnoId: databaseId(req.user.id) },
    );
    if (!inscrito.length) return res.status(403).json({ msg: "No estás inscripto en esta materia." });

    const id = randomUUID().replaceAll("-", "").toUpperCase();
    await executeSql(
      `INSERT INTO school_entregas (id, tarea_id, alumno_id, archivo, comentario)
       VALUES (UNHEX(:id), UNHEX(:tareaId), UNHEX(:alumnoId), :archivo, :comentario)`,
      {
        id,
        tareaId: databaseId(tareaId),
        alumnoId: databaseId(req.user.id),
        archivo: req.file.filename,
        comentario: req.body.comentario?.trim() || null,
      },
    );
    const [row] = await queryRows(`${entregaSelect} ${entregaJoins} WHERE e.id = UNHEX(:id) LIMIT 1`, { id });
    return res.status(201).json({ msg: "Tarea entregada con éxito.", entrega: formatearEntrega(row) });
  } catch (error) {
    if (error.original?.code === "ER_DUP_ENTRY" || error.parent?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msg: "Ya has entregado esta tarea." });
    }
    console.error("Error guardando entrega:", error);
    return res.status(500).json({ msg: "Error al guardar la entrega." });
  }
};

export const obtenerEntregasPorTarea = async (req, res) => {
  const { tareaId } = req.params;
  if (!isDatabaseId(tareaId)) return res.status(400).json({ msg: "ID de tarea inválido." });
  try {
    const [tarea] = await queryRows(
      "SELECT HEX(profesor_id) AS profesorId FROM school_tareas WHERE id = UNHEX(:tareaId) LIMIT 1",
      { tareaId: databaseId(tareaId) },
    );
    if (!tarea) return res.status(404).json({ msg: "Tarea no encontrada." });
    if (req.user.rol !== "admin" && tarea.profesorId !== databaseId(req.user.id)) {
      return res.status(403).json({ msg: "No tienes acceso a esta tarea." });
    }
    const rows = await queryRows(
      `${entregaSelect} ${entregaJoins} WHERE e.tarea_id = UNHEX(:tareaId) ORDER BY e.fecha_entrega DESC`,
      { tareaId: databaseId(tareaId) },
    );
    return res.json(rows.map(formatearEntrega));
  } catch (error) {
    console.error("Error consultando entregas:", error);
    return res.status(500).json({ msg: "Error al obtener las entregas." });
  }
};

export const corregirEntrega = async (req, res) => {
  const { id } = req.params;
  const { nota, comentario } = req.body;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de entrega inválido." });
  const grade = nota === undefined || nota === "" ? undefined : Number(nota);
  if (grade !== undefined && (!Number.isFinite(grade) || grade < 0 || grade > 10)) {
    return res.status(400).json({ msg: "La nota debe ser un número entre 0 y 10." });
  }
  if (comentario !== undefined && typeof comentario !== "string") {
    return res.status(400).json({ msg: "El comentario debe ser texto." });
  }
  try {
    const [existing] = await queryRows(
      `${entregaSelect} ${entregaJoins} WHERE e.id = UNHEX(:id) LIMIT 1`,
      { id: databaseId(id) },
    );
    if (!existing) return res.status(404).json({ msg: "Entrega no encontrada." });
    if (req.user.rol !== "admin" && existing.profesorId !== databaseId(req.user.id)) {
      return res.status(403).json({ msg: "No tienes autorización para corregir esta entrega." });
    }
    await executeSql(
      `UPDATE school_entregas SET
         nota = COALESCE(:nota, nota),
         comentario = COALESCE(:comentario, comentario),
         fecha_correccion = CURRENT_TIMESTAMP
       WHERE id = UNHEX(:id)`,
      {
        nota: grade ?? null,
        comentario: comentario === undefined ? null : comentario,
        id: databaseId(id),
      },
    );
    const [row] = await queryRows(`${entregaSelect} ${entregaJoins} WHERE e.id = UNHEX(:id) LIMIT 1`, {
      id: databaseId(id),
    });
    return res.json({ mensaje: "Entrega corregida correctamente.", entrega: formatearEntrega(row) });
  } catch (error) {
    console.error("Error calificando entrega:", error);
    return res.status(500).json({ mensaje: "Error al corregir la entrega." });
  }
};

export const obtenerEntregasAlumno = async (req, res) => {
  try {
    const rows = await queryRows(
      `${entregaSelect} ${entregaJoins}
       WHERE e.alumno_id = UNHEX(:alumnoId) ORDER BY e.fecha_entrega DESC`,
      { alumnoId: databaseId(req.user.id) },
    );
    return res.json(rows.map(formatearEntrega));
  } catch (error) {
    console.error("Error consultando entregas del alumno:", error);
    return res.status(500).json({ msg: "Error al obtener tus entregas." });
  }
};
