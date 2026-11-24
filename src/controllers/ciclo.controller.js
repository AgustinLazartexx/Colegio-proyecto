import {
  databaseId,
  executeSql,
  isDatabaseId,
  newDatabaseIdSql,
  queryRows,
  sequelize,
} from "../services/relationalData.service.js";
import {
  academicCycleDates,
  calculateSubjectResult,
  suggestedAcademicStatus,
} from "../services/academicCycleRules.js";

const cicloPublico = (row) => ({
  _id: row.id,
  anio: Number(row.anio),
  nombre: row.nombre,
  fechaInicio: row.fechaInicio,
  fechaCierre: row.fechaCierre,
  estado: row.estado,
});

const cargarCiclo = async (id, transaction) => {
  const rows = await queryRows(
    `SELECT HEX(id) AS id, anio, nombre, fecha_inicio AS fechaInicio,
            fecha_cierre AS fechaCierre, estado
     FROM ciclos_lectivos WHERE id = UNHEX(:id) LIMIT 1${transaction ? " FOR UPDATE" : ""}`,
    { id: databaseId(id) },
    transaction,
  );
  return rows[0] ?? null;
};

const obtenerMateriasDelCiclo = async (cicloId, transaction) =>
  queryRows(
    `    SELECT HEX(i.id) AS inscripcionId, HEX(i.alumno_id) AS alumnoId,
            u.nombre AS alumnoNombre, i.nivel, i.division,
           HEX(m.id) AS materiaId, m.nombre AS materiaNombre,
            MAX(CASE WHEN n.trimestre = 1 THEN n.nota_final_trimestre END) AS trimestre1,
            MAX(CASE WHEN n.trimestre = 2 THEN n.nota_final_trimestre END) AS trimestre2,
            MAX(CASE WHEN n.trimestre = 3 THEN n.nota_final_trimestre END) AS trimestre3,
            MAX(r.nota_recuperacion) AS notaRecuperacion
     FROM inscripciones_ciclo i
     JOIN users u ON u.id = i.alumno_id
     JOIN clases c ON c.ciclo_lectivo_id = i.ciclo_lectivo_id
       AND c.nivel = i.nivel AND c.division = i.division
     JOIN materias m ON m.id = c.materia_id
     LEFT JOIN school_notas_trimestrales n ON n.ciclo_lectivo_id = i.ciclo_lectivo_id
       AND n.materia_id = m.id AND n.alumno_id = i.alumno_id
     LEFT JOIN school_resultados_materia r ON r.ciclo_lectivo_id = i.ciclo_lectivo_id
       AND r.materia_id = m.id AND r.alumno_id = i.alumno_id
     WHERE i.ciclo_lectivo_id = UNHEX(:cicloId) AND i.estado_academico = 'CURSANDO'
     GROUP BY i.id, i.alumno_id, u.nombre, i.nivel, i.division, m.id, m.nombre
     ORDER BY i.nivel, i.division, u.nombre, m.nombre`,
    { cicloId: databaseId(cicloId) },
    transaction,
  );

const calcularPreview = async (cicloId, transaction) => {
  const materias = await obtenerMateriasDelCiclo(cicloId, transaction);
  const porInscripcion = new Map();
  for (const row of materias) {
    const key = row.inscripcionId;
    if (!porInscripcion.has(key)) {
      porInscripcion.set(key, {
        _id: row.alumnoId,
        nombre: row.alumnoNombre,
        nivel: Number(row.nivel),
        division: row.division,
        materiasDesaprobadas: [],
        materiasIncompletas: [],
      });
    }

    const resultado = calculateSubjectResult(row);
    if (resultado.incompleta) {
      porInscripcion.get(key).materiasIncompletas.push({
        materiaId: row.materiaId,
        materia: row.materiaNombre,
        notasFaltantes: [row.trimestre1, row.trimestre2, row.trimestre3]
          .flatMap((nota, index) => nota === null || nota === undefined ? [`T${index + 1}`] : []),
      });
    } else if (resultado.estadoMateria === "DESAPROBADA") {
      porInscripcion.get(key).materiasDesaprobadas.push({
        materiaId: row.materiaId,
        materia: row.materiaNombre,
        puntajeFinal: resultado.puntajeFinal,
        notaRecuperacion: row.notaRecuperacion === null ? null : Number(row.notaRecuperacion),
      });
    }
  }

  const [unmapped] = await queryRows(
    `SELECT COUNT(*) AS total FROM inscripciones_ciclo i
     WHERE i.ciclo_lectivo_id = UNHEX(:cicloId) AND i.estado_academico = 'CURSANDO'
       AND NOT EXISTS (
         SELECT 1 FROM clases c
         WHERE c.ciclo_lectivo_id = i.ciclo_lectivo_id AND c.nivel = i.nivel
           AND c.division = i.division
       )`,
    { cicloId: databaseId(cicloId) },
    transaction,
  );

  const alumnos = [...porInscripcion.values()].map((student) => ({
    ...student,
    cantidadDesaprobadas: student.materiasDesaprobadas.length,
    estadoSugerido: suggestedAcademicStatus(student.nivel, student.materiasDesaprobadas.length),
  }));
  return { alumnos, materias, cursosSinClases: Number(unmapped.total) };
};

const verificarAsignacionMateria = async (cicloId, materiaId, user, transaction) => {
  if (user.rol === "admin") return;
  const assignment = await queryRows(
    `SELECT 1 FROM clases c
     JOIN materias m ON m.id = c.materia_id
     LEFT JOIN clase_profesores cp ON cp.clase_id = c.id
     WHERE c.ciclo_lectivo_id = UNHEX(:cicloId) AND c.materia_id = UNHEX(:materiaId)
       AND (cp.profesor_id = UNHEX(:profesorId) OR m.profesor_id = UNHEX(:profesorId))
     LIMIT 1`,
    {
      cicloId: databaseId(cicloId),
      materiaId: databaseId(materiaId),
      profesorId: databaseId(user.id),
    },
    transaction,
  );
  if (!assignment.length) {
    const error = new Error("No tienes asignada esta materia en el ciclo seleccionado.");
    error.status = 403;
    throw error;
  }
};

export const listarCiclos = async (_req, res) => {
  try {
    const rows = await queryRows(
      `SELECT HEX(id) AS id, anio, nombre, fecha_inicio AS fechaInicio,
              fecha_cierre AS fechaCierre, estado
       FROM ciclos_lectivos ORDER BY anio DESC`,
    );
    return res.json(rows.map(cicloPublico));
  } catch (error) {
    console.error("Error listando ciclos lectivos:", error);
    return res.status(500).json({ msg: "Error al listar los ciclos lectivos." });
  }
};

export const obtenerCicloActivo = async (_req, res) => {
  try {
    const rows = await queryRows(
      `SELECT HEX(id) AS id, anio, nombre, fecha_inicio AS fechaInicio,
              fecha_cierre AS fechaCierre, estado
       FROM ciclos_lectivos WHERE estado IN ('ACTIVO', 'RECUPERACION') LIMIT 1`,
    );
    if (!rows.length) return res.status(404).json({ msg: "No hay un ciclo lectivo activo." });
    return res.json(cicloPublico(rows[0]));
  } catch (error) {
    console.error("Error consultando ciclo activo:", error);
    return res.status(500).json({ msg: "Error al obtener el ciclo activo." });
  }
};

export const crearCiclo = async (req, res) => {
  const anio = Number(req.body.anio);
  const nombre = typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";
  const { fechaInicio, fechaCierre } = academicCycleDates(anio);
  if (!Number.isInteger(anio) || anio < 1900 || anio > 9998) {
    return res.status(400).json({ msg: "El año del ciclo no es válido." });
  }
  if (nombre.length < 1 || nombre.length > 100) {
    return res.status(400).json({ msg: "El nombre del ciclo es obligatorio (máximo 100 caracteres)." });
  }
  if ((req.body.fechaInicio && req.body.fechaInicio !== fechaInicio) ||
      (req.body.fechaCierre && req.body.fechaCierre !== fechaCierre)) {
    return res.status(400).json({ msg: "Las fechas del ciclo deben ser del 2 de marzo al 2 de marzo del año siguiente." });
  }
  if (req.body.estado && req.body.estado !== "PLANIFICADO") {
    return res.status(400).json({ msg: "Un ciclo nuevo debe crearse en estado PLANIFICADO." });
  }

  try {
    await executeSql(
      `INSERT INTO ciclos_lectivos
         (id, anio, nombre, fecha_inicio, fecha_cierre, estado, slot_activo)
       VALUES (${newDatabaseIdSql}, :anio, :nombre, :fechaInicio, :fechaCierre, 'PLANIFICADO', NULL)`,
      { anio, nombre, fechaInicio, fechaCierre },
    );
    const [cycle] = await queryRows(
      `SELECT HEX(id) AS id, anio, nombre, fecha_inicio AS fechaInicio,
              fecha_cierre AS fechaCierre, estado
       FROM ciclos_lectivos WHERE anio = :anio`,
      { anio },
    );
    return res.status(201).json(cicloPublico(cycle));
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError" ||
        error.original?.code === "ER_DUP_ENTRY" ||
        error.parent?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msg: "Ya existe un ciclo lectivo para ese año." });
    }
    console.error("Error creando ciclo lectivo:", error);
    return res.status(500).json({ msg: "Error al crear el ciclo lectivo." });
  }
};

export const cambiarEstadoCiclo = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de ciclo inválido." });
  if (!["ACTIVO", "RECUPERACION"].includes(estado)) {
    return res.status(400).json({ msg: "El estado debe ser ACTIVO o RECUPERACION." });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const cycle = await cargarCiclo(id, transaction);
      if (!cycle) {
        const error = new Error("Ciclo lectivo no encontrado.");
        error.status = 404;
        throw error;
      }
      if (cycle.estado === "CERRADO") {
        const error = new Error("Un ciclo cerrado no puede reabrirse.");
        error.status = 409;
        throw error;
      }
      const [conflict] = await queryRows(
        `SELECT HEX(id) AS id FROM ciclos_lectivos
         WHERE estado IN ('ACTIVO', 'RECUPERACION') AND id <> UNHEX(:id)
         LIMIT 1 FOR UPDATE`,
        { id: databaseId(id) },
        transaction,
      );
      if (conflict) {
        const error = new Error("Ya existe otro ciclo ACTIVO o en RECUPERACION.");
        error.status = 409;
        throw error;
      }
      await executeSql(
        `UPDATE ciclos_lectivos SET estado = :estado, slot_activo = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = UNHEX(:id)`,
        { estado, id: databaseId(id) },
        transaction,
      );
      if (estado === "ACTIVO") {
        const enrollments = await queryRows(
          `SELECT HEX(alumno_id) AS alumnoId, nivel, division
           FROM inscripciones_ciclo
           WHERE ciclo_lectivo_id = UNHEX(:id) AND estado_academico = 'CURSANDO'
           FOR UPDATE`,
          { id: databaseId(id) },
          transaction,
        );
        for (const enrollment of enrollments) {
          await executeSql(
            "UPDATE users SET anio = :nivel, division = :division WHERE id = UNHEX(:alumnoId)",
            {
              nivel: Number(enrollment.nivel),
              division: enrollment.division,
              alumnoId: databaseId(enrollment.alumnoId),
            },
            transaction,
          );
        }
      }
      return { ...cycle, estado };
    });
    return res.json(cicloPublico(result));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error cambiando estado del ciclo:", error);
    if (error.original?.code === "ER_DUP_ENTRY" || error.parent?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msg: "Ya existe otro ciclo ACTIVO o en RECUPERACION." });
    }
    return res.status(500).json({ msg: "No se pudo cambiar el estado del ciclo." });
  }
};

export const previewCierre = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de ciclo inválido." });
  try {
    const cycle = await cargarCiclo(id);
    if (!cycle) return res.status(404).json({ msg: "Ciclo lectivo no encontrado." });
    if (cycle.estado !== "RECUPERACION") {
      return res.status(409).json({ msg: "El preview de cierre requiere un ciclo en estado RECUPERACION." });
    }
    const preview = await calcularPreview(id);
    return res.json({
      ciclo: cicloPublico(cycle),
      sePuedeCerrar: preview.cursosSinClases === 0 &&
        preview.alumnos.every((student) => student.materiasIncompletas.length === 0),
      cursosSinClases: preview.cursosSinClases,
      alumnos: preview.alumnos,
    });
  } catch (error) {
    console.error("Error calculando preview de cierre:", error);
    return res.status(500).json({ msg: "Error al calcular el cierre del ciclo." });
  }
};

const guardarResultadoMateria = async (cicloId, row, resultado, transaction) => {
  const params = {
    cicloId: databaseId(cicloId),
    materiaId: databaseId(row.materiaId),
    alumnoId: databaseId(row.alumnoId),
    trimestre1: Number(row.trimestre1),
    trimestre2: Number(row.trimestre2),
    trimestre3: Number(row.trimestre3),
    puntajeFinal: resultado.puntajeFinal,
    notaRecuperacion: row.notaRecuperacion === null ? null : Number(row.notaRecuperacion),
    estadoMateria: resultado.estadoMateria,
  };
  const [existing] = await queryRows(
    `SELECT HEX(id) AS id FROM school_resultados_materia
     WHERE ciclo_lectivo_id = UNHEX(:cicloId) AND materia_id = UNHEX(:materiaId)
       AND alumno_id = UNHEX(:alumnoId) LIMIT 1`,
    params,
    transaction,
  );
  if (existing) {
    await executeSql(
      `UPDATE school_resultados_materia
       SET trimestre1 = :trimestre1, trimestre2 = :trimestre2, trimestre3 = :trimestre3,
           puntaje_final = :puntajeFinal, nota_recuperacion = :notaRecuperacion,
           estado_materia = :estadoMateria, updated_at = CURRENT_TIMESTAMP
       WHERE id = UNHEX(:id)`,
      { ...params, id: databaseId(existing.id) },
      transaction,
    );
    return;
  }
  await executeSql(
    `INSERT INTO school_resultados_materia
       (id, ciclo_lectivo_id, materia_id, alumno_id, trimestre1, trimestre2, trimestre3,
        puntaje_final, nota_recuperacion, estado_materia)
     VALUES (${newDatabaseIdSql}, UNHEX(:cicloId), UNHEX(:materiaId), UNHEX(:alumnoId),
        :trimestre1, :trimestre2, :trimestre3, :puntajeFinal, :notaRecuperacion, :estadoMateria)`,
    params,
    transaction,
  );
};

export const cargarNotaRecuperacion = async (req, res) => {
  const { id: cicloId, alumnoId, materiaId } = req.params;
  const notaRecuperacion = Number(req.body.notaRecuperacion);
  if (![cicloId, alumnoId, materiaId].every(isDatabaseId)) {
    return res.status(400).json({ msg: "Ciclo, alumno o materia inválidos." });
  }
  if (!Number.isFinite(notaRecuperacion) || notaRecuperacion < 1 || notaRecuperacion > 10) {
    return res.status(400).json({ msg: "La nota de recuperación debe estar entre 1 y 10." });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const cycle = await cargarCiclo(cicloId, transaction);
      if (!cycle) {
        const error = new Error("Ciclo lectivo no encontrado.");
        error.status = 404;
        throw error;
      }
      if (cycle.estado !== "RECUPERACION") {
        const error = new Error("Solo se cargan recuperaciones en un ciclo RECUPERACION.");
        error.status = 409;
        throw error;
      }
      await verificarAsignacionMateria(cicloId, materiaId, req.user, transaction);
      const rows = await queryRows(
        `SELECT HEX(i.alumno_id) AS alumnoId, HEX(m.id) AS materiaId,
                MAX(CASE WHEN n.trimestre = 1 THEN n.nota_final_trimestre END) AS trimestre1,
                MAX(CASE WHEN n.trimestre = 2 THEN n.nota_final_trimestre END) AS trimestre2,
                MAX(CASE WHEN n.trimestre = 3 THEN n.nota_final_trimestre END) AS trimestre3,
                MAX(r.nota_recuperacion) AS notaRecuperacion
         FROM inscripciones_ciclo i
         JOIN clases c ON c.ciclo_lectivo_id = i.ciclo_lectivo_id
           AND c.nivel = i.nivel AND c.division = i.division
         JOIN materias m ON m.id = c.materia_id
         LEFT JOIN school_notas_trimestrales n ON n.ciclo_lectivo_id = i.ciclo_lectivo_id
           AND n.materia_id = m.id AND n.alumno_id = i.alumno_id
         LEFT JOIN school_resultados_materia r ON r.ciclo_lectivo_id = i.ciclo_lectivo_id
           AND r.materia_id = m.id AND r.alumno_id = i.alumno_id
         WHERE i.ciclo_lectivo_id = UNHEX(:cicloId)
           AND i.alumno_id = UNHEX(:alumnoId) AND m.id = UNHEX(:materiaId)
           AND i.estado_academico = 'CURSANDO'
         GROUP BY i.id, i.alumno_id, m.id
         LIMIT 1 FOR UPDATE`,
        {
          cicloId: databaseId(cicloId),
          alumnoId: databaseId(alumnoId),
          materiaId: databaseId(materiaId),
        },
        transaction,
      );
      const row = rows[0];
      if (!row) {
        const error = new Error("El alumno no cursa esta materia en el ciclo indicado.");
        error.status = 404;
        throw error;
      }
      const current = calculateSubjectResult(row);
      if (current.incompleta || current.puntajeFinal >= 18) {
        const error = new Error("La materia requiere tres notas trimestrales completas y un puntaje menor a 18.");
        error.status = 409;
        throw error;
      }
      if (row.notaRecuperacion !== null && row.notaRecuperacion !== undefined) {
        const error = new Error("El alumno ya tiene una nota de recuperación para esta materia.");
        error.status = 409;
        throw error;
      }
      const updated = { ...row, notaRecuperacion };
      const outcome = calculateSubjectResult(updated);
      await guardarResultadoMateria(cicloId, updated, outcome, transaction);
      return {
        alumnoId,
        materiaId,
        puntajeFinal: current.puntajeFinal,
        notaRecuperacion,
        estadoMateria: outcome.estadoMateria,
      };
    });
    return res.json({ msg: "Nota de recuperación guardada.", ...result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error guardando nota de recuperación:", error);
    return res.status(500).json({ msg: "Error al guardar la recuperación." });
  }
};

export const listarRecuperacionesMateria = async (req, res) => {
  const { id: cicloId, materiaId } = req.params;
  if (![cicloId, materiaId].every(isDatabaseId)) {
    return res.status(400).json({ msg: "Ciclo o materia inválidos." });
  }
  try {
    const cycle = await cargarCiclo(cicloId);
    if (!cycle) return res.status(404).json({ msg: "Ciclo lectivo no encontrado." });
    if (!["RECUPERACION", "CERRADO"].includes(cycle.estado)) {
      return res.status(409).json({ msg: "Los resultados de recuperación se consultan durante la recuperación o después del cierre." });
    }
    await verificarAsignacionMateria(cicloId, materiaId, req.user);
    const rows = await queryRows(
      `SELECT HEX(i.alumno_id) AS alumnoId, u.nombre AS alumnoNombre,
              MAX(CASE WHEN n.trimestre = 1 THEN n.nota_final_trimestre END) AS trimestre1,
              MAX(CASE WHEN n.trimestre = 2 THEN n.nota_final_trimestre END) AS trimestre2,
              MAX(CASE WHEN n.trimestre = 3 THEN n.nota_final_trimestre END) AS trimestre3,
              MAX(r.nota_recuperacion) AS notaRecuperacion,
              MAX(r.estado_materia) AS estadoMateria
       FROM inscripciones_ciclo i
       JOIN users u ON u.id = i.alumno_id
       JOIN clases c ON c.ciclo_lectivo_id = i.ciclo_lectivo_id
         AND c.nivel = i.nivel AND c.division = i.division
       JOIN clase_alumnos ca ON ca.clase_id = c.id AND ca.alumno_id = i.alumno_id
         AND ca.isActive = TRUE
       LEFT JOIN school_notas_trimestrales n ON n.ciclo_lectivo_id = i.ciclo_lectivo_id
         AND n.materia_id = c.materia_id AND n.alumno_id = i.alumno_id
       LEFT JOIN school_resultados_materia r ON r.ciclo_lectivo_id = i.ciclo_lectivo_id
         AND r.materia_id = c.materia_id AND r.alumno_id = i.alumno_id
       WHERE i.ciclo_lectivo_id = UNHEX(:cicloId) AND c.materia_id = UNHEX(:materiaId)
       GROUP BY i.id, i.alumno_id, u.nombre ORDER BY u.nombre`,
      { cicloId: databaseId(cicloId), materiaId: databaseId(materiaId) },
    );
    return res.json(rows.map((row) => {
      const resultado = calculateSubjectResult(row);
      return {
        alumnoId: row.alumnoId,
        alumnoNombre: row.alumnoNombre,
        puntajeFinal: resultado.puntajeFinal,
        notaRecuperacion: row.notaRecuperacion === null ? null : Number(row.notaRecuperacion),
        estadoMateria: row.estadoMateria || resultado.estadoMateria,
      };
    }));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error listando recuperaciones:", error);
    return res.status(500).json({ msg: "Error al consultar las recuperaciones." });
  }
};

export const cerrarCiclo = async (req, res) => {
  const { id } = req.params;
  const ajustes = req.body?.ajustes ?? [];
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de ciclo inválido." });
  if (!Array.isArray(ajustes) || ajustes.some((item) =>
    !isDatabaseId(item?.alumnoId) || item?.estadoAcademico !== "BAJA")) {
    return res.status(400).json({ msg: "Los ajustes solo pueden asignar BAJA e indicar un alumno válido." });
  }

  try {
    const summary = await sequelize.transaction(async (transaction) => {
      const cycle = await cargarCiclo(id, transaction);
      if (!cycle) {
        const error = new Error("Ciclo lectivo no encontrado.");
        error.status = 404;
        throw error;
      }
      if (cycle.estado !== "RECUPERACION") {
        const error = new Error("Solo se puede cerrar un ciclo en estado RECUPERACION.");
        error.status = 409;
        throw error;
      }

      const preview = await calcularPreview(id, transaction);
      if (preview.cursosSinClases > 0 || preview.alumnos.some((student) => student.materiasIncompletas.length > 0)) {
        const error = new Error("No se puede cerrar: hay cursos sin clases o notas trimestrales incompletas.");
        error.status = 409;
        error.details = {
          cursosSinClases: preview.cursosSinClases,
          alumnosIncompletos: preview.alumnos
            .filter((student) => student.materiasIncompletas.length > 0)
            .map((student) => ({ alumnoId: student._id, materias: student.materiasIncompletas })),
        };
        throw error;
      }

      const overrides = new Set(ajustes.map((item) => databaseId(item.alumnoId)));
      const studentIds = new Set(preview.alumnos.map((student) => databaseId(student._id)));
      if ([...overrides].some((studentId) => !studentIds.has(studentId))) {
        const error = new Error("Un ajuste corresponde a un alumno que no está cursando en este ciclo.");
        error.status = 400;
        throw error;
      }

      for (const row of preview.materias) {
        const resultado = calculateSubjectResult(row);
        await guardarResultadoMateria(id, row, resultado, transaction);
      }

      let promovidos = 0;
      let bajas = 0;
      for (const student of preview.alumnos) {
        const isBaja = overrides.has(databaseId(student._id));
        const status = isBaja
          ? "BAJA"
          : suggestedAcademicStatus(student.nivel, student.cantidadDesaprobadas);
        await executeSql(
          `UPDATE inscripciones_ciclo
           SET estado_academico = :status, cantidad_desaprobadas = :failedCount,
               updated_at = CURRENT_TIMESTAMP
           WHERE alumno_id = UNHEX(:alumnoId) AND ciclo_lectivo_id = UNHEX(:cicloId)`,
          {
            status,
            failedCount: student.cantidadDesaprobadas,
            alumnoId: databaseId(student._id),
            cicloId: databaseId(id),
          },
          transaction,
        );
        if (status === "BAJA") bajas += 1;
        else promovidos += 1;

        if (["PROMOVIDO_CON_PREVIAS", "EGRESADO_CON_PREVIAS"].includes(status)) {
          for (const subject of student.materiasDesaprobadas) {
            const [existing] = await queryRows(
              `SELECT id FROM materias_previas
               WHERE alumno_id = UNHEX(:alumnoId) AND materia_id = UNHEX(:materiaId)
                 AND ciclo_origen_id = UNHEX(:cicloId) LIMIT 1`,
              {
                alumnoId: databaseId(student._id),
                materiaId: databaseId(subject.materiaId),
                cicloId: databaseId(id),
              },
              transaction,
            );
            if (!existing) {
              await executeSql(
                `INSERT INTO materias_previas
                   (id, alumno_id, materia_id, ciclo_origen_id, nivel_origen, estado)
                 VALUES (${newDatabaseIdSql}, UNHEX(:alumnoId), UNHEX(:materiaId),
                   UNHEX(:cicloId), :nivel, 'PENDIENTE')`,
                {
                  alumnoId: databaseId(student._id),
                  materiaId: databaseId(subject.materiaId),
                  cicloId: databaseId(id),
                  nivel: student.nivel,
                },
                transaction,
              );
            }
          }
        }
      }

      await executeSql(
        `        UPDATE ciclos_lectivos SET estado = 'CERRADO', slot_activo = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = UNHEX(:id)`,
        { id: databaseId(id) },
        transaction,
      );
      return { alumnosEvaluados: preview.alumnos.length, promovidos, bajas };
    });
    return res.json({ msg: "Ciclo cerrado correctamente.", ...summary });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message, detalles: error.details });
    console.error("Error cerrando ciclo lectivo:", error);
    return res.status(500).json({ msg: "Error al cerrar el ciclo." });
  }
};

export const clonarClases = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de ciclo inválido." });
  try {
    const copied = await sequelize.transaction(async (transaction) => {
      const target = await cargarCiclo(id, transaction);
      if (!target) {
        const error = new Error("Ciclo lectivo no encontrado.");
        error.status = 404;
        throw error;
      }
      if (target.estado !== "PLANIFICADO") {
        const error = new Error("Las clases solo se preparan para un ciclo PLANIFICADO.");
        error.status = 409;
        throw error;
      }
      const targetClasses = await queryRows(
        "SELECT id FROM clases WHERE ciclo_lectivo_id = UNHEX(:id) LIMIT 1",
        { id: databaseId(id) },
        transaction,
      );
      if (targetClasses.length) {
        const error = new Error("El ciclo ya tiene clases; no se duplicó la estructura.");
        error.status = 409;
        throw error;
      }

      const [source] = await queryRows(
        `SELECT HEX(id) AS id FROM ciclos_lectivos
         WHERE anio < :anio AND estado = 'CERRADO' ORDER BY anio DESC LIMIT 1`,
        { anio: target.anio },
        transaction,
      );
      if (!source) {
        const error = new Error("No hay un ciclo anterior cerrado para clonar.");
        error.status = 409;
        throw error;
      }

      const sourceClasses = await queryRows(
        `SELECT HEX(id) AS id, HEX(materia_id) AS materiaId, nivel, anio, division,
                diaSemana, horaInicio, horaFin, duracion, aula
         FROM clases WHERE ciclo_lectivo_id = UNHEX(:sourceId) ORDER BY nivel, division, diaSemana, horaInicio`,
        { sourceId: databaseId(source.id) },
        transaction,
      );
      if (!sourceClasses.length) {
        const error = new Error("El ciclo anterior no tiene clases para clonar.");
        error.status = 409;
        throw error;
      }
      const mapping = new Map();
      for (const sourceClass of sourceClasses) {
        const newId = await queryRows(`SELECT HEX(${newDatabaseIdSql}) AS id`, {}, transaction);
        const classId = databaseId(newId[0].id);
        await executeSql(
          `INSERT INTO clases
             (id, materia_id, nivel, anio, division, diaSemana, horaInicio, horaFin, duracion,
              aula, ciclo_lectivo_id, isActive, createdAt, updatedAt)
           VALUES (UNHEX(:id), UNHEX(:materiaId), :nivel, :nivel, :division, :diaSemana, :horaInicio,
              :horaFin, :duracion, :aula, UNHEX(:cicloId), TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          {
            id: classId,
            materiaId: sourceClass.materiaId,
            nivel: sourceClass.nivel,
            division: sourceClass.division,
            diaSemana: sourceClass.diaSemana,
            horaInicio: sourceClass.horaInicio,
            horaFin: sourceClass.horaFin,
            duracion: sourceClass.duracion,
            aula: sourceClass.aula,
            cicloId: databaseId(id),
          },
          transaction,
        );
        mapping.set(databaseId(sourceClass.id), classId);
      }

      for (const [sourceId, targetId] of mapping) {
        const teachers = await queryRows(
          "SELECT HEX(profesor_id) AS id FROM clase_profesores WHERE clase_id = UNHEX(:id)",
          { id: sourceId },
          transaction,
        );
        for (const teacher of teachers) {
          await executeSql(
            `INSERT INTO clase_profesores (clase_id, profesor_id, createdAt)
             VALUES (UNHEX(:classId), UNHEX(:teacherId), CURRENT_TIMESTAMP)`,
            { classId: targetId, teacherId: databaseId(teacher.id) },
            transaction,
          );
        }
      }
      return { cantidad: sourceClasses.length, cicloOrigenId: source.id };
    });
    return res.status(201).json({ msg: "Estructura de clases clonada.", ...copied });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error clonando clases del ciclo:", error);
    return res.status(500).json({ msg: "Error al clonar las clases." });
  }
};

export const importarAlumnos = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de ciclo inválido." });
  try {
    const summary = await sequelize.transaction(async (transaction) => {
      const target = await cargarCiclo(id, transaction);
      if (!target) {
        const error = new Error("Ciclo lectivo no encontrado.");
        error.status = 404;
        throw error;
      }
      if (target.estado !== "PLANIFICADO") {
        const error = new Error("Los alumnos solo se importan a un ciclo PLANIFICADO.");
        error.status = 409;
        throw error;
      }
      const [previous] = await queryRows(
        `SELECT HEX(id) AS id FROM ciclos_lectivos
         WHERE anio < :anio AND estado = 'CERRADO' ORDER BY anio DESC LIMIT 1`,
        { anio: target.anio },
        transaction,
      );
      if (!previous) {
        const error = new Error("No hay un ciclo anterior cerrado desde el cual importar alumnos.");
        error.status = 409;
        throw error;
      }

      const previousEnrollments = await queryRows(
        `SELECT HEX(alumno_id) AS alumnoId, nivel, division, estado_academico AS estado
         FROM inscripciones_ciclo
         WHERE ciclo_lectivo_id = UNHEX(:previousId)
           AND estado_academico IN ('PROMOVIDO', 'PROMOVIDO_CON_PREVIAS', 'REPITENTE')
         ORDER BY alumno_id`,
        { previousId: databaseId(previous.id) },
        transaction,
      );

      let imported = 0;
      let excluded = 0;
      for (const entry of previousEnrollments) {
        const level = Number(entry.nivel) + (entry.estado === "REPITENTE" ? 0 : 1);
        if (level > 6) {
          const error = new Error(`El alumno ${entry.alumnoId} no puede ser inscrito en un nivel mayor a 6.`);
          error.status = 409;
          throw error;
        }
        const classes = await queryRows(
          `SELECT HEX(id) AS id FROM clases
           WHERE ciclo_lectivo_id = UNHEX(:cicloId) AND nivel = :nivel
             AND division = :division AND isActive = TRUE`,
          { cicloId: databaseId(id), nivel: level, division: entry.division },
          transaction,
        );
        if (!classes.length) {
          const error = new Error(`Faltan clases para ${level}° ${entry.division}; no se importó ningún alumno.`);
          error.status = 409;
          throw error;
        }

        const [alreadyEnrolled] = await queryRows(
          `SELECT nivel, division, estado_academico AS estado FROM inscripciones_ciclo
           WHERE ciclo_lectivo_id = UNHEX(:cicloId) AND alumno_id = UNHEX(:alumnoId) LIMIT 1`,
          { cicloId: databaseId(id), alumnoId: databaseId(entry.alumnoId) },
          transaction,
        );
        if (alreadyEnrolled &&
            (Number(alreadyEnrolled.nivel) !== level || alreadyEnrolled.division !== entry.division ||
             alreadyEnrolled.estado !== "CURSANDO")) {
          const error = new Error(`El alumno ${entry.alumnoId} ya tiene una inscripción incompatible en el ciclo nuevo.`);
          error.status = 409;
          throw error;
        }
        if (!alreadyEnrolled) {
          await executeSql(
            `INSERT INTO inscripciones_ciclo
               (id, alumno_id, ciclo_lectivo_id, nivel, division, estado_academico, cantidad_desaprobadas)
             VALUES (${newDatabaseIdSql}, UNHEX(:alumnoId), UNHEX(:cicloId), :nivel, :division, 'CURSANDO', 0)`,
            {
              alumnoId: databaseId(entry.alumnoId),
              cicloId: databaseId(id),
              nivel: level,
              division: entry.division,
            },
            transaction,
          );
        } else {
          excluded += 1;
        }
        for (const schoolClass of classes) {
          await executeSql(
            `INSERT IGNORE INTO clase_alumnos (clase_id, alumno_id, isActive, createdAt)
             VALUES (UNHEX(:claseId), UNHEX(:alumnoId), TRUE, CURRENT_TIMESTAMP)`,
            { claseId: databaseId(schoolClass.id), alumnoId: databaseId(entry.alumnoId) },
            transaction,
          );
        }
        if (!alreadyEnrolled) imported += 1;
      }
      return { cicloOrigenId: previous.id, inscriptos: imported, yaInscriptos: excluded };
    });
    return res.json({ msg: "Importación de alumnos completada.", ...summary });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error importando alumnos al ciclo:", error);
    return res.status(500).json({ msg: "Error al importar los alumnos." });
  }
};

export const listarPrevias = async (req, res) => {
  const alumnoId = req.params.alumnoId ?? req.user.id;
  if (!isDatabaseId(alumnoId)) return res.status(400).json({ msg: "ID de alumno inválido." });
  if (req.user.rol === "alumno" && databaseId(alumnoId) !== databaseId(req.user.id)) {
    return res.status(403).json({ msg: "No puede consultar las materias previas de otro alumno." });
  }
  try {
    const rows = await queryRows(
      `SELECT HEX(p.id) AS _id, HEX(p.alumno_id) AS alumnoId,
              HEX(p.materia_id) AS materiaId, m.nombre AS materia,
              HEX(p.ciclo_origen_id) AS cicloOrigenId, c.anio AS anioOrigen,
              p.nivel_origen AS nivelOrigen, p.nota_aprobacion AS notaAprobacion,
              p.fecha_aprobacion AS fechaAprobacion, p.estado
       FROM materias_previas p
       JOIN materias m ON m.id = p.materia_id
       JOIN ciclos_lectivos c ON c.id = p.ciclo_origen_id
       WHERE p.alumno_id = UNHEX(:alumnoId)
       ORDER BY p.estado, c.anio DESC, m.nombre`,
      { alumnoId: databaseId(alumnoId) },
    );
    return res.json(rows.map((row) => ({
      ...row,
      nivelOrigen: Number(row.nivelOrigen),
      notaAprobacion: row.notaAprobacion === null ? null : Number(row.notaAprobacion),
    })));
  } catch (error) {
    console.error("Error listando materias previas:", error);
    return res.status(500).json({ msg: "Error al consultar las materias previas." });
  }
};

export const aprobarPrevia = async (req, res) => {
  const { id } = req.params;
  const nota = Number(req.body.notaAprobacion);
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de materia previa inválido." });
  if (!Number.isFinite(nota) || nota < 6 || nota > 10) {
    return res.status(400).json({ msg: "La nota de aprobación debe estar entre 6 y 10." });
  }
  try {
    const [result] = await executeSql(
      `UPDATE materias_previas
       SET estado = 'APROBADA', nota_aprobacion = :nota,
           fecha_aprobacion = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE id = UNHEX(:id) AND estado = 'PENDIENTE'`,
      { nota, id: databaseId(id) },
    );
    if (!result.affectedRows) return res.status(404).json({ msg: "Materia previa pendiente no encontrada." });
    return res.json({ msg: "Materia previa aprobada.", notaAprobacion: nota });
  } catch (error) {
    console.error("Error aprobando materia previa:", error);
    return res.status(500).json({ msg: "Error al aprobar la materia previa." });
  }
};
