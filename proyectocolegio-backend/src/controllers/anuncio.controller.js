import { randomUUID } from "node:crypto";
import {
  databaseId,
  executeSql,
  isDatabaseId,
  queryRows,
} from "../services/relationalData.service.js";

const anuncioSelect = `SELECT HEX(a.id) AS _id, HEX(a.profesor_id) AS profesorId,
  HEX(a.materia_id) AS materiaId, a.titulo, a.mensaje, a.fecha, a.createdAt, a.updatedAt,
  a.isActive,
  p.nombre AS profesorNombre, p.email AS profesorEmail, m.nombre AS materiaNombre`;
const anuncioJoins = `FROM school_anuncios a
  JOIN users p ON p.id = a.profesor_id
  JOIN materias m ON m.id = a.materia_id`;

const anuncioPublico = (row) => ({
  _id: row._id,
  profesor: { _id: row.profesorId, nombre: row.profesorNombre, email: row.profesorEmail },
  materia: { _id: row.materiaId, nombre: row.materiaNombre },
  titulo: row.titulo,
  mensaje: row.mensaje,
  isActive: Boolean(row.isActive),
  fecha: row.fecha,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const tieneAccesoMateria = async (materiaId, profesorId) => {
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

export const crearAnuncio = async (req, res) => {
  const { materia, titulo, mensaje } = req.body;
  if (!isDatabaseId(materia) || !titulo?.trim() || !mensaje?.trim()) {
    return res.status(400).json({ msg: "Materia, título y mensaje son obligatorios." });
  }
  try {
    if (!(await tieneAccesoMateria(materia, req.user.id))) {
      return res.status(403).json({ msg: "No puedes publicar en esta materia." });
    }
    const id = randomUUID().replaceAll("-", "").toUpperCase();
    await executeSql(
      `INSERT INTO school_anuncios (id, profesor_id, materia_id, titulo, mensaje, isActive)
       VALUES (UNHEX(:id), UNHEX(:profesorId), UNHEX(:materiaId), :titulo, :mensaje, TRUE)`,
      {
        id,
        profesorId: databaseId(req.user.id),
        materiaId: databaseId(materia),
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
      },
    );
    const [row] = await queryRows(`${anuncioSelect} ${anuncioJoins} WHERE a.id = UNHEX(:id) LIMIT 1`, { id });
    return res.status(201).json({ msg: "Anuncio creado con éxito.", anuncio: anuncioPublico(row) });
  } catch (error) {
    console.error("Error creando anuncio:", error);
    return res.status(500).json({ msg: "Error al crear anuncio." });
  }
};

export const obtenerAnunciosProfesor = async (req, res) => {
  try {
    const rows = await queryRows(
      `${anuncioSelect} ${anuncioJoins}
       WHERE a.profesor_id = UNHEX(:profesorId) ORDER BY a.fecha DESC`,
      { profesorId: databaseId(req.user.id) },
    );
    return res.json(rows.map(anuncioPublico));
  } catch (error) {
    console.error("Error consultando anuncios del profesor:", error);
    return res.status(500).json({ msg: "Error al obtener anuncios." });
  }
};

export const actualizarAnuncio = async (req, res) => {
  const { id } = req.params;
  const { titulo, mensaje, materia } = req.body;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de anuncio inválido." });
  if (titulo !== undefined && (typeof titulo !== "string" || !titulo.trim())) return res.status(400).json({ msg: "El título no puede estar vacío." });
  if (mensaje !== undefined && (typeof mensaje !== "string" || !mensaje.trim())) return res.status(400).json({ msg: "El mensaje no puede estar vacío." });
  if (materia !== undefined && !isDatabaseId(materia)) return res.status(400).json({ msg: "ID de materia inválido." });
  try {
    const [existing] = await queryRows(
      `SELECT HEX(profesor_id) AS profesorId, HEX(materia_id) AS materiaId, titulo, mensaje
       FROM school_anuncios WHERE id = UNHEX(:id) LIMIT 1`,
      { id: databaseId(id) },
    );
    if (!existing) return res.status(404).json({ msg: "Anuncio no encontrado." });
    if (existing.profesorId !== databaseId(req.user.id)) {
      return res.status(403).json({ msg: "No autorizado para modificar este anuncio." });
    }
    const materiaId = materia || existing.materiaId;
    if (!(await tieneAccesoMateria(materiaId, req.user.id))) {
      return res.status(403).json({ msg: "No puedes publicar en esta materia." });
    }
    await executeSql(
      `UPDATE school_anuncios SET titulo = :titulo, mensaje = :mensaje, materia_id = UNHEX(:materiaId)
       WHERE id = UNHEX(:id)`,
      {
        id: databaseId(id),
        titulo: titulo === undefined ? existing.titulo : titulo.trim(),
        mensaje: mensaje === undefined ? existing.mensaje : mensaje.trim(),
        materiaId: databaseId(materiaId),
      },
    );
    const [row] = await queryRows(`${anuncioSelect} ${anuncioJoins} WHERE a.id = UNHEX(:id) LIMIT 1`, { id: databaseId(id) });
    return res.json({ msg: "Anuncio actualizado con éxito.", anuncio: anuncioPublico(row) });
  } catch (error) {
    console.error("Error actualizando anuncio:", error);
    return res.status(500).json({ msg: "Error al actualizar anuncio." });
  }
};

export const cambiarEstadoAnuncio = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de anuncio inválido." });
  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ msg: "El estado del anuncio es inválido." });
  }
  try {
    const [existing] = await queryRows(
      "SELECT HEX(profesor_id) AS profesorId FROM school_anuncios WHERE id = UNHEX(:id) LIMIT 1",
      { id: databaseId(id) },
    );
    if (!existing) return res.status(404).json({ msg: "Anuncio no encontrado." });
    if (existing.profesorId !== databaseId(req.user.id)) {
      return res.status(403).json({ msg: "No autorizado para cambiar el estado de este anuncio." });
    }
    await executeSql(
      "UPDATE school_anuncios SET isActive = :isActive WHERE id = UNHEX(:id)",
      { id: databaseId(id), isActive: req.body.isActive },
    );
    const [row] = await queryRows(
      `${anuncioSelect} ${anuncioJoins} WHERE a.id = UNHEX(:id) LIMIT 1`,
      { id: databaseId(id) },
    );
    return res.json({
      msg: req.body.isActive ? "Anuncio reactivado." : "Anuncio suspendido.",
      anuncio: anuncioPublico(row),
    });
  } catch (error) {
    console.error("Error cambiando el estado del anuncio:", error);
    return res.status(500).json({ msg: "Error al cambiar el estado del anuncio." });
  }
};

export const obtenerAnunciosAlumno = async (req, res) => {
  try {
    const rows = await queryRows(
      `${anuncioSelect.replace("SELECT ", "SELECT DISTINCT ")} ${anuncioJoins}
       JOIN clases c ON c.materia_id = a.materia_id
       JOIN clase_alumnos ca ON ca.clase_id = c.id
       WHERE ca.alumno_id = UNHEX(:alumnoId) AND a.isActive = TRUE
         AND c.isActive = TRUE AND m.isActive = TRUE
       ORDER BY a.fecha DESC`,
      { alumnoId: databaseId(req.user.id) },
    );
    return res.json(rows.map(anuncioPublico));
  } catch (error) {
    console.error("Error consultando anuncios del alumno:", error);
    return res.status(500).json({ msg: "Error al obtener anuncios." });
  }
};
