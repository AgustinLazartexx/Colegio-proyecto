import {
  databaseId,
  executeSql,
  isDatabaseId,
  queryRows,
  sequelize,
} from "../services/relationalData.service.js";

const camposPermitidos = new Set(["orientadora", "proceso", "integradora", "recuperacion"]);
const columnasNota = {
  orientadora: "orientadora",
  proceso: "proceso",
  integradora: "integradora",
  recuperacion: "recuperacion",
};

const verificarProfesorMateria = async (materiaId, usuario) => {
  if (usuario.rol === "admin") return true;
  const rows = await queryRows(
    `SELECT m.id FROM materias m
     LEFT JOIN clases c ON c.materia_id = m.id
     LEFT JOIN clase_profesores cp ON cp.clase_id = c.id AND cp.profesor_id = UNHEX(:profesorId)
     WHERE m.id = UNHEX(:materiaId) AND m.isActive = TRUE
       AND (m.profesor_id = UNHEX(:profesorId) OR (c.isActive = TRUE AND cp.profesor_id IS NOT NULL))
     LIMIT 1`,
    { materiaId: databaseId(materiaId), profesorId: databaseId(usuario.id) },
  );
  if (!rows.length) {
    const exists = await queryRows(
      "SELECT id FROM materias WHERE id = UNHEX(:materiaId) LIMIT 1",
      { materiaId: databaseId(materiaId) },
    );
    const error = new Error(exists.length ? "No autorizado para esta materia." : "Materia no encontrada.");
    error.status = exists.length ? 403 : 404;
    throw error;
  }
  return true;
};

const notaPublica = (row) => ({
  _id: row._id,
  materia: row.materiaId,
  alumno: row.alumnoId,
  trimestre: Number(row.trimestre),
  orientadora: row.orientadora === null ? null : Number(row.orientadora),
  proceso: row.proceso === null ? null : Number(row.proceso),
  integradora: row.integradora === null ? null : Number(row.integradora),
  recuperacion: row.recuperacion === null ? null : Number(row.recuperacion),
  promedioPonderado: row.promedioPonderado === null ? null : Number(row.promedioPonderado),
  notaFinalTrimestre: row.notaFinalTrimestre === null ? null : Number(row.notaFinalTrimestre),
  observacion: row.observacion,
  isAprobadaAdmin: Boolean(row.isAprobadaAdmin),
  isBloqueada: Boolean(row.isBloqueada),
  actualizadoPor: row.actualizadoPor,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const calcularNotas = ({ orientadora, proceso, integradora, recuperacion }) => {
  let promedioPonderado = null;
  let notaFinalTrimestre = null;
  if ([orientadora, proceso, integradora].every((value) => value !== null && value !== undefined)) {
    promedioPonderado = orientadora * 0.15 + proceso * 0.25 + integradora * 0.6;
  }
  if (recuperacion !== null && recuperacion !== undefined) {
    notaFinalTrimestre = recuperacion >= 6 ? Math.min(recuperacion, 7) : 5;
  } else if (promedioPonderado !== null) {
    notaFinalTrimestre = promedioPonderado;
  }
  return { promedioPonderado, notaFinalTrimestre };
};

export const guardarNota = async (req, res) => {
  const { materiaId, alumnoId, trimestre, tipoNota, nota } = req.body;
  if (!isDatabaseId(materiaId) || !isDatabaseId(alumnoId) || !camposPermitidos.has(tipoNota)) {
    return res.status(400).json({ msg: "Materia, alumno o tipo de nota inválido." });
  }
  const trimestreNum = Number(trimestre);
  if (!Number.isInteger(trimestreNum) || trimestreNum < 1 || trimestreNum > 3 || nota === undefined) {
    return res.status(400).json({ msg: "Debe indicar un trimestre entre 1 y 3 y una nota." });
  }
  const notaNueva = nota === "" || nota === null ? null : Number(nota);
  if (notaNueva !== null && (!Number.isFinite(notaNueva) || notaNueva < 0 || notaNueva > 10)) {
    return res.status(400).json({ msg: "La nota debe ser un número entre 0 y 10 o quedar vacía." });
  }

  const materiaKey = databaseId(materiaId);
  const alumnoKey = databaseId(alumnoId);
  try {
    await verificarProfesorMateria(materiaKey, req.user);
    const inscripto = await queryRows(
      `SELECT ca.alumno_id FROM clase_alumnos ca
       JOIN clases c ON c.id = ca.clase_id
       WHERE c.materia_id = UNHEX(:materiaId) AND c.isActive = TRUE
         AND ca.alumno_id = UNHEX(:alumnoId)
       LIMIT 1`,
      { materiaId: materiaKey, alumnoId: alumnoKey },
    );
    if (!inscripto.length) return res.status(400).json({ msg: "El alumno no está inscripto en esta materia." });

    const result = await sequelize.transaction(async (transaction) => {
      const rows = await queryRows(
        `SELECT HEX(id) AS _id, HEX(materia_id) AS materiaId, HEX(alumno_id) AS alumnoId,
                trimestre, orientadora, proceso, integradora, recuperacion,
                promedio_ponderado AS promedioPonderado, nota_final_trimestre AS notaFinalTrimestre,
                observacion, is_aprobada_admin AS isAprobadaAdmin, is_bloqueada AS isBloqueada,
                HEX(actualizado_por) AS actualizadoPor, createdAt, updatedAt
         FROM school_notas_trimestrales
         WHERE materia_id = UNHEX(:materiaId) AND alumno_id = UNHEX(:alumnoId) AND trimestre = :trimestre
         FOR UPDATE`,
        { materiaId: materiaKey, alumnoId: alumnoKey, trimestre: trimestreNum },
        transaction,
      );
      let current = rows[0];
      if (current?.isBloqueada && req.user.rol !== "admin") {
        const error = new Error("El trimestre está cerrado y aprobado por administración.");
        error.status = 403;
        throw error;
      }
      if (!current) {
        await executeSql(
          `INSERT INTO school_notas_trimestrales (id, materia_id, alumno_id, trimestre, actualizado_por)
           VALUES (UNHEX(REPLACE(UUID(), '-', '')), UNHEX(:materiaId), UNHEX(:alumnoId), :trimestre, UNHEX(:userId))`,
          { materiaId: materiaKey, alumnoId: alumnoKey, trimestre: trimestreNum, userId: databaseId(req.user.id) },
          transaction,
        );
        [current] = await queryRows(
          `SELECT HEX(id) AS _id, HEX(materia_id) AS materiaId, HEX(alumno_id) AS alumnoId,
                  trimestre, orientadora, proceso, integradora, recuperacion,
                  promedio_ponderado AS promedioPonderado, nota_final_trimestre AS notaFinalTrimestre,
                  observacion, is_aprobada_admin AS isAprobadaAdmin, is_bloqueada AS isBloqueada,
                  HEX(actualizado_por) AS actualizadoPor, createdAt, updatedAt
           FROM school_notas_trimestrales
           WHERE materia_id = UNHEX(:materiaId) AND alumno_id = UNHEX(:alumnoId) AND trimestre = :trimestre
           FOR UPDATE`,
          { materiaId: materiaKey, alumnoId: alumnoKey, trimestre: trimestreNum },
          transaction,
        );
      }

      const field = columnasNota[tipoNota];
      const anterior = current[field] === null ? null : Number(current[field]);
      if (anterior === notaNueva) return { row: current, changed: false };

      if (req.user.rol === "admin" && anterior !== null) {
        await executeSql(
          `INSERT INTO school_auditoria_notas
            (id, nota_id, materia_id, alumno_id, trimestre, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
           VALUES (UNHEX(REPLACE(UUID(), '-', '')), UNHEX(:notaId), UNHEX(:materiaId), UNHEX(:alumnoId),
             :trimestre, :campo, :valorAnterior, :valorNuevo, UNHEX(:userId))`,
          {
            notaId: current._id,
            materiaId: materiaKey,
            alumnoId: alumnoKey,
            trimestre: trimestreNum,
            campo: tipoNota,
            valorAnterior: String(anterior),
            valorNuevo: notaNueva === null ? "" : String(notaNueva),
            userId: databaseId(req.user.id),
          },
          transaction,
        );
      }

      const valores = {
        orientadora: current.orientadora === null ? null : Number(current.orientadora),
        proceso: current.proceso === null ? null : Number(current.proceso),
        integradora: current.integradora === null ? null : Number(current.integradora),
        recuperacion: current.recuperacion === null ? null : Number(current.recuperacion),
        [tipoNota]: notaNueva,
      };
      const calculadas = calcularNotas(valores);
      await executeSql(
        `UPDATE school_notas_trimestrales
         SET \`${field}\` = :nota, promedio_ponderado = :promedio,
             nota_final_trimestre = :notaFinal, actualizado_por = UNHEX(:userId)
         WHERE id = UNHEX(:notaId)`,
        {
          nota: notaNueva,
          promedio: calculadas.promedioPonderado,
          notaFinal: calculadas.notaFinalTrimestre,
          userId: databaseId(req.user.id),
          notaId: current._id,
        },
        transaction,
      );
      [current] = await queryRows(
        `SELECT HEX(id) AS _id, HEX(materia_id) AS materiaId, HEX(alumno_id) AS alumnoId,
                trimestre, orientadora, proceso, integradora, recuperacion,
                promedio_ponderado AS promedioPonderado, nota_final_trimestre AS notaFinalTrimestre,
                observacion, is_aprobada_admin AS isAprobadaAdmin, is_bloqueada AS isBloqueada,
                HEX(actualizado_por) AS actualizadoPor, createdAt, updatedAt
         FROM school_notas_trimestrales WHERE id = UNHEX(:notaId)`,
        { notaId: current._id },
        transaction,
      );
      return { row: current, changed: true };
    });

    return res.json({
      msg: result.changed ? "Nota actualizada correctamente." : "Sin cambios.",
      nota: notaPublica(result.row),
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error guardando nota trimestral:", error);
    return res.status(500).json({ msg: "Error al guardar la nota." });
  }
};

export const cambiarEstadoTrimestre = async (req, res) => {
  const { notaId, isAprobadaAdmin, isBloqueada, observacion } = req.body;
  if (!isDatabaseId(notaId)) return res.status(400).json({ msg: "ID de nota inválido." });
  if (
    (isAprobadaAdmin !== undefined && typeof isAprobadaAdmin !== "boolean") ||
    (isBloqueada !== undefined && typeof isBloqueada !== "boolean") ||
    (observacion !== undefined && typeof observacion !== "string")
  ) {
    return res.status(400).json({ msg: "Los valores de estado u observación no son válidos." });
  }
  const fields = [];
  const replacements = { notaId: databaseId(notaId), userId: databaseId(req.user.id) };
  if (isAprobadaAdmin !== undefined) {
    fields.push("is_aprobada_admin = :isAprobadaAdmin");
    replacements.isAprobadaAdmin = isAprobadaAdmin;
  }
  if (isBloqueada !== undefined) {
    fields.push("is_bloqueada = :isBloqueada");
    replacements.isBloqueada = isBloqueada;
  }
  if (observacion !== undefined) {
    fields.push("observacion = :observacion");
    replacements.observacion = observacion.trim();
  }
  if (!fields.length) return res.status(400).json({ msg: "No se recibieron cambios." });

  try {
    const [result] = await executeSql(
      `UPDATE school_notas_trimestrales SET ${fields.join(", ")}, actualizado_por = UNHEX(:userId)
       WHERE id = UNHEX(:notaId)`,
      replacements,
    );
    if (!result.affectedRows) return res.status(404).json({ msg: "Documento de notas no encontrado." });
    const [row] = await queryRows(
      `SELECT HEX(id) AS _id, HEX(materia_id) AS materiaId, HEX(alumno_id) AS alumnoId,
              trimestre, orientadora, proceso, integradora, recuperacion,
              promedio_ponderado AS promedioPonderado, nota_final_trimestre AS notaFinalTrimestre,
              observacion, is_aprobada_admin AS isAprobadaAdmin, is_bloqueada AS isBloqueada,
              HEX(actualizado_por) AS actualizadoPor, createdAt, updatedAt
       FROM school_notas_trimestrales WHERE id = UNHEX(:notaId)`,
      { notaId: databaseId(notaId) },
    );
    return res.json({ msg: "Estado del trimestre actualizado.", doc: notaPublica(row) });
  } catch (error) {
    console.error("Error cambiando el estado del trimestre:", error);
    return res.status(500).json({ msg: "Error al cambiar estado." });
  }
};

export const getNotasPorMateriaTrimestre = async (req, res) => {
  const { id } = req.params;
  const trimestre = Number(req.query.trimestre);
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de materia inválido." });
  if (!Number.isInteger(trimestre) || trimestre < 1 || trimestre > 3) {
    return res.status(400).json({ msg: "Debe especificar un trimestre entre 1 y 3." });
  }
  try {
    await verificarProfesorMateria(id, req.user);
    const rows = await queryRows(
      `SELECT HEX(id) AS _id, HEX(materia_id) AS materiaId, HEX(alumno_id) AS alumnoId,
              trimestre, orientadora, proceso, integradora, recuperacion,
              promedio_ponderado AS promedioPonderado, nota_final_trimestre AS notaFinalTrimestre,
              observacion, is_aprobada_admin AS isAprobadaAdmin, is_bloqueada AS isBloqueada,
              HEX(actualizado_por) AS actualizadoPor, createdAt, updatedAt
       FROM school_notas_trimestrales
       WHERE materia_id = UNHEX(:materiaId) AND trimestre = :trimestre`,
      { materiaId: databaseId(id), trimestre },
    );
    return res.json(Object.fromEntries(rows.map((row) => [row.alumnoId, notaPublica(row)])));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error consultando notas de materia:", error);
    return res.status(500).json({ msg: "Error al obtener las notas." });
  }
};

export const getAuditoriaNotas = async (req, res) => {
  const replacements = {};
  let where = "1 = 1";
  if (req.query.materiaId) {
    if (!isDatabaseId(req.query.materiaId)) return res.status(400).json({ msg: "ID de materia inválido." });
    where += " AND a.materia_id = UNHEX(:materiaId)";
    replacements.materiaId = databaseId(req.query.materiaId);
  }
  if (req.query.trimestre) {
    const trimestre = Number(req.query.trimestre);
    if (!Number.isInteger(trimestre) || trimestre < 1 || trimestre > 3) return res.status(400).json({ msg: "Trimestre inválido." });
    where += " AND a.trimestre = :trimestre";
    replacements.trimestre = trimestre;
  }
  try {
    const rows = await queryRows(
      `SELECT HEX(a.id) AS _id, HEX(a.nota_id) AS notaOriginalId,
              HEX(a.materia_id) AS materiaId, HEX(a.alumno_id) AS alumnoId,
              a.trimestre, a.campo_modificado AS campoModificado,
              a.valor_anterior AS valorAnterior, a.valor_nuevo AS valorNuevo,
              HEX(a.modificado_por) AS modificadoPorId, a.createdAt,
              materia.nombre AS materiaNombre, alumno.nombre AS alumnoNombre,
              admin.nombre AS modificadoPorNombre
       FROM school_auditoria_notas a
       JOIN materias materia ON materia.id = a.materia_id
       JOIN users alumno ON alumno.id = a.alumno_id
       JOIN users admin ON admin.id = a.modificado_por
       WHERE ${where} ORDER BY a.createdAt DESC`,
      replacements,
    );
    return res.json(rows.map((row) => ({
      _id: row._id,
      notaOriginalId: row.notaOriginalId,
      materia: { _id: row.materiaId, nombre: row.materiaNombre },
      alumno: { _id: row.alumnoId, nombre: row.alumnoNombre },
      trimestre: Number(row.trimestre),
      campoModificado: row.campoModificado,
      valorAnterior: row.valorAnterior,
      valorNuevo: row.valorNuevo,
      modificadoPor: { _id: row.modificadoPorId, nombre: row.modificadoPorNombre },
      createdAt: row.createdAt,
    })));
  } catch (error) {
    console.error("Error consultando auditoría de notas:", error);
    return res.status(500).json({ msg: "Error al obtener auditoría." });
  }
};

export const misNotasAlumno = async (req, res) => {
  try {
    const rows = await queryRows(
      `SELECT HEX(n.id) AS _id, HEX(n.materia_id) AS materiaId, HEX(n.alumno_id) AS alumnoId,
              n.trimestre, n.orientadora, n.proceso, n.integradora, n.recuperacion,
              n.promedio_ponderado AS promedioPonderado,
              n.nota_final_trimestre AS notaFinalTrimestre,
              n.observacion, n.is_aprobada_admin AS isAprobadaAdmin,
              n.is_bloqueada AS isBloqueada, HEX(n.actualizado_por) AS actualizadoPor,
              n.createdAt, n.updatedAt, m.nombre AS materiaNombre
       FROM school_notas_trimestrales n
       JOIN materias m ON m.id = n.materia_id
       WHERE n.alumno_id = UNHEX(:alumnoId)
       ORDER BY m.nombre, n.trimestre`,
      { alumnoId: databaseId(req.user.id) },
    );
    return res.json({
      total: rows.length,
      notas: rows.map((row) => ({ ...notaPublica(row), materia: { _id: row.materiaId, nombre: row.materiaNombre } })),
    });
  } catch (error) {
    console.error("Error consultando boletín:", error);
    return res.status(500).json({ msg: "Error al obtener notas." });
  }
};
