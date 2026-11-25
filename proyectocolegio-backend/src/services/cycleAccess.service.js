import { databaseId, isDatabaseId, queryRows } from "./relationalData.service.js";

export const cycleDateOnly = (value) => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  throw new TypeError("Fecha de ciclo lectivo inválida.");
};

export const getCycleById = async (cycleId, transaction) => {
  if (!isDatabaseId(cycleId)) {
    const error = new Error("ID de ciclo lectivo inválido.");
    error.status = 400;
    throw error;
  }
  const rows = await queryRows(
    `SELECT HEX(id) AS id, anio, nombre, fecha_inicio AS fechaInicio,
            fecha_cierre AS fechaCierre, estado
     FROM ciclos_lectivos WHERE id = UNHEX(:id) LIMIT 1`,
    { id: databaseId(cycleId) },
    transaction,
  );
  if (!rows.length) {
    const error = new Error("Ciclo lectivo no encontrado.");
    error.status = 404;
    throw error;
  }
  return rows[0];
};

export const getActiveCycle = async (transaction) => {
  const rows = await queryRows(
    `SELECT HEX(id) AS id, anio, nombre, fecha_inicio AS fechaInicio,
            fecha_cierre AS fechaCierre, estado
     FROM ciclos_lectivos WHERE estado IN ('ACTIVO', 'RECUPERACION') LIMIT 1`,
    {},
    transaction,
  );
  if (!rows.length) {
    const error = new Error("No hay un ciclo lectivo activo.");
    error.status = 409;
    throw error;
  }
  return rows[0];
};

export const assertCycleWritable = (
  cycle,
  { recoveryOnly = false, allowPlanned = false, allowRecovery = true } = {},
) => {
  if (cycle.estado === "CERRADO") {
    const error = new Error("El ciclo está CERRADO y es de solo lectura.");
    error.status = 403;
    throw error;
  }
  if (recoveryOnly) {
    if (cycle.estado !== "RECUPERACION") {
      const error = new Error("La carga de recuperaciones requiere un ciclo en estado RECUPERACION.");
      error.status = 409;
      throw error;
    }
    return;
  }
  if (
    cycle.estado !== "ACTIVO" &&
    !(allowPlanned && cycle.estado === "PLANIFICADO") &&
    !(allowRecovery && cycle.estado === "RECUPERACION")
  ) {
    const error = new Error(allowPlanned
      ? "La operación solo está habilitada en ciclos PLANIFICADOS, ACTIVOS o RECUPERACION."
      : "La edición regular solo está habilitada en un ciclo ACTIVO.");
    error.status = 409;
    throw error;
  }
};
