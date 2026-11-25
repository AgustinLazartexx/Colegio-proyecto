import {
  databaseId,
  executeSql,
  isDatabaseId,
  normalizeDate,
  queryRows,
  sequelize,
} from "../services/relationalData.service.js";
import {
  cycleDateOnly,
  getActiveCycle,
  getCycleById,
} from "../services/cycleAccess.service.js";

const cuotaSelect = `SELECT HEX(id) AS _id, HEX(alumno_id) AS alumno,
  HEX(ciclo_lectivo_id) AS cicloLectivoId,
  mes, anio, monto, estado, fecha_vencimiento AS fechaVencimiento,
  fecha_pago AS fechaPago, metodo_pago AS metodoPago, createdAt, updatedAt
  FROM school_cuotas`;

const recalcularAccesoAlumno = async (alumnoId, transaction) => {
  const deudas = await queryRows(
    `SELECT id FROM school_cuotas
     WHERE alumno_id = UNHEX(:alumnoId) AND estado = 'vencido' LIMIT 1`,
    { alumnoId: databaseId(alumnoId) },
    transaction,
  );
  await executeSql(
    "UPDATE users SET acceso_habilitado = :habilitado WHERE id = UNHEX(:alumnoId) AND rol = 'alumno'",
    { habilitado: deudas.length === 0, alumnoId: databaseId(alumnoId) },
    transaction,
  );
  return deudas.length === 0;
};

export const generarCuota = async (req, res) => {
  const { alumnoId, mes, anio, monto, fechaVencimiento } = req.body;
  const monthNum = Number(mes);
  const yearNum = Number(anio);
  const amountNum = Number(monto);
  const dueDate = normalizeDate(fechaVencimiento);
  if (!isDatabaseId(alumnoId) || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12 ||
      !Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 9999 ||
      !Number.isFinite(amountNum) || amountNum < 0 || !dueDate) {
    return res.status(400).json({ msg: "Alumno, período, monto y vencimiento deben ser válidos." });
  }
  try {
    const cycle = req.cicloLectivo ?? (req.body.cicloLectivoId
      ? await getCycleById(req.body.cicloLectivoId)
      : await getActiveCycle());
    if (dueDate < cycleDateOnly(cycle.fechaInicio) || dueDate > cycleDateOnly(cycle.fechaCierre)) {
      return res.status(400).json({ msg: "La fecha de vencimiento debe pertenecer al ciclo lectivo seleccionado." });
    }
    const alumno = await queryRows(
      "SELECT HEX(id) AS id FROM users WHERE id = UNHEX(:id) AND rol = 'alumno' LIMIT 1",
      { id: databaseId(alumnoId) },
    );
    if (!alumno.length) return res.status(404).json({ msg: "Alumno no encontrado." });
    await executeSql(
      `INSERT INTO school_cuotas
         (id, ciclo_lectivo_id, alumno_id, mes, anio, monto, fecha_vencimiento)
       VALUES (UNHEX(REPLACE(UUID(), '-', '')), UNHEX(:cicloId), UNHEX(:alumnoId),
         :mes, :anio, :monto, :fechaVencimiento)`,
      {
        cicloId: databaseId(cycle.id),
        alumnoId: databaseId(alumnoId),
        mes: monthNum,
        anio: yearNum,
        monto: amountNum,
        fechaVencimiento: dueDate,
      },
    );
    const [cuota] = await queryRows(
      `${cuotaSelect} WHERE alumno_id = UNHEX(:alumnoId) AND mes = :mes AND anio = :anio`,
      { alumnoId: databaseId(alumnoId), mes: monthNum, anio: yearNum },
    );
    return res.status(201).json({ msg: "Cuota generada exitosamente.", cuota });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    if (error.original?.code === "ER_DUP_ENTRY" || error.parent?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msg: "Ya existe una cuota para este alumno en ese mes y año." });
    }
    console.error("Error generando cuota:", error);
    return res.status(500).json({ msg: "Error al generar cuota." });
  }
};

export const registrarPago = async (req, res) => {
  const { id } = req.params;
  const metodoPago = req.body.metodoPago || "efectivo";
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de cuota inválido." });
  if (!["efectivo", "transferencia", "tarjeta"].includes(metodoPago)) {
    return res.status(400).json({ msg: "Método de pago inválido." });
  }
  try {
    const response = await sequelize.transaction(async (transaction) => {
      const [cuota] = await queryRows(
        "SELECT HEX(alumno_id) AS alumnoId FROM school_cuotas WHERE id = UNHEX(:id) FOR UPDATE",
        { id: databaseId(id) },
        transaction,
      );
      if (!cuota) return null;
      await executeSql(
        `UPDATE school_cuotas SET estado = 'pagado', fecha_pago = CURRENT_TIMESTAMP, metodo_pago = :metodoPago
         WHERE id = UNHEX(:id)`,
        { metodoPago, id: databaseId(id) },
        transaction,
      );
      const accesoHabilitado = await recalcularAccesoAlumno(cuota.alumnoId, transaction);
      const [updated] = await queryRows(
        `${cuotaSelect} WHERE id = UNHEX(:id)`,
        { id: databaseId(id) },
        transaction,
      );
      return { cuota: updated, accesoHabilitado };
    });
    if (!response) return res.status(404).json({ msg: "Cuota no encontrada." });
    return res.json({
      msg: "Pago registrado. Estado del alumno actualizado.",
      cuota: response.cuota,
      acceso_alumno: response.accesoHabilitado ? "HABILITADO" : "BLOQUEADO (Aún tiene deudas)",
    });
  } catch (error) {
    console.error("Error registrando pago:", error);
    return res.status(500).json({ msg: "Error al registrar pago." });
  }
};

export const marcarVencida = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de cuota inválido." });
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const [cuota] = await queryRows(
        "SELECT HEX(alumno_id) AS alumnoId, estado FROM school_cuotas WHERE id = UNHEX(:id) FOR UPDATE",
        { id: databaseId(id) },
        transaction,
      );
      if (!cuota) return { missing: true };
      if (cuota.estado === "pagado") return { paid: true };
      await executeSql("UPDATE school_cuotas SET estado = 'vencido' WHERE id = UNHEX(:id)", { id: databaseId(id) }, transaction);
      const accesoHabilitado = await recalcularAccesoAlumno(cuota.alumnoId, transaction);
      return { accesoHabilitado };
    });
    if (result.missing) return res.status(404).json({ msg: "Cuota no encontrada." });
    if (result.paid) return res.status(400).json({ msg: "No se puede vencer una cuota pagada." });
    return res.json({
      msg: "Cuota marcada como vencida.",
      acceso_alumno: result.accesoHabilitado ? "HABILITADO" : "BLOQUEADO (Aún tiene deudas)",
    });
  } catch (error) {
    console.error("Error actualizando cuota vencida:", error);
    return res.status(500).json({ msg: "Error al actualizar cuota." });
  }
};

export const getCuotasPorAlumno = async (req, res) => {
  const { id } = req.params;
  if (!isDatabaseId(id)) return res.status(400).json({ msg: "ID de alumno inválido." });
  try {
    const cycle = req.query.cicloLectivoId
      ? await getCycleById(req.query.cicloLectivoId)
      : await getActiveCycle();
    const rows = await queryRows(
      `${cuotaSelect} WHERE alumno_id = UNHEX(:alumnoId)
       AND ciclo_lectivo_id = UNHEX(:cycleId) ORDER BY anio DESC, mes DESC`,
      { alumnoId: databaseId(id), cycleId: databaseId(cycle.id) },
    );
    return res.json(rows);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error consultando cuotas del alumno:", error);
    return res.status(500).json({ msg: "Error al obtener cuotas." });
  }
};

export const listarCuotasAdmin = async (req, res) => {
  const { cicloLectivoId, estado = "vencido" } = req.query;
  if (!isDatabaseId(cicloLectivoId)) {
    return res.status(400).json({ msg: "ID de ciclo lectivo inválido." });
  }
  if (!["pendiente", "vencido", "pagado", "todos"].includes(estado)) {
    return res.status(400).json({ msg: "Estado de cuota inválido." });
  }

  try {
    const cycle = await getCycleById(cicloLectivoId);
    const rows = await queryRows(
      `SELECT HEX(u.id) AS alumnoId, u.nombre, u.dni,
              MAX(i.nivel) AS nivel, MAX(i.division) AS division,
              COUNT(c.id) AS cantidadCuotas, SUM(c.monto) AS montoTotal,
              MIN(c.fecha_vencimiento) AS vencimientoMasAntiguo
       FROM school_cuotas c
       JOIN users u ON u.id = c.alumno_id
       LEFT JOIN inscripciones_ciclo i
         ON i.alumno_id = c.alumno_id AND i.ciclo_lectivo_id = c.ciclo_lectivo_id
       WHERE c.ciclo_lectivo_id = UNHEX(:cycleId)
         AND (:estado = 'todos' OR c.estado = :estado)
       GROUP BY u.id, u.nombre, u.dni
       ORDER BY montoTotal DESC, u.nombre`,
      { cycleId: databaseId(cycle.id), estado },
    );
    return res.json(rows.map((row) => ({
      ...row,
      nivel: row.nivel === null ? null : Number(row.nivel),
      cantidadCuotas: Number(row.cantidadCuotas),
      montoTotal: Number(row.montoTotal),
    })));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error listando cuotas de administración:", error);
    return res.status(500).json({ msg: "Error al obtener el listado de cuotas." });
  }
};

export const getMisCuotas = async (req, res) => {
  try {
    const cycle = req.query.cicloLectivoId
      ? await getCycleById(req.query.cicloLectivoId)
      : await getActiveCycle();
    const rows = await queryRows(
      `${cuotaSelect} WHERE alumno_id = UNHEX(:alumnoId)
       AND ciclo_lectivo_id = UNHEX(:cycleId) ORDER BY anio DESC, mes DESC`,
      { alumnoId: databaseId(req.user.id), cycleId: databaseId(cycle.id) },
    );
    return res.json(rows);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error consultando tus cuotas:", error);
    return res.status(500).json({ msg: "Error al obtener mis cuotas." });
  }
};
