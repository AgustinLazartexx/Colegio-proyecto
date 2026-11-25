import { unlink } from "node:fs/promises";
import { getActiveCycle, getCycleById, assertCycleWritable } from "../services/cycleAccess.service.js";
import { databaseId, isDatabaseId, queryRows } from "../services/relationalData.service.js";

const cycleLookup = {
  clase: (id) => ({
    sql: "SELECT HEX(ciclo_lectivo_id) AS cicloId FROM clases WHERE id = UNHEX(:id) LIMIT 1",
    replacements: { id: databaseId(id) },
  }),
  tarea: (id) => ({
    sql: "SELECT HEX(ciclo_lectivo_id) AS cicloId FROM school_tareas WHERE id = UNHEX(:id) LIMIT 1",
    replacements: { id: databaseId(id) },
  }),
  cuota: (id) => ({
    sql: "SELECT HEX(ciclo_lectivo_id) AS cicloId FROM school_cuotas WHERE id = UNHEX(:id) LIMIT 1",
    replacements: { id: databaseId(id) },
  }),
  entrega: (id) => ({
    sql: `SELECT HEX(t.ciclo_lectivo_id) AS cicloId
          FROM school_entregas e JOIN school_tareas t ON t.id = e.tarea_id
          WHERE e.id = UNHEX(:id) LIMIT 1`,
    replacements: { id: databaseId(id) },
  }),
  nota: (id) => ({
    sql: "SELECT HEX(ciclo_lectivo_id) AS cicloId FROM school_notas_trimestrales WHERE id = UNHEX(:id) LIMIT 1",
    replacements: { id: databaseId(id) },
  }),
  calificacion: (id) => ({
    sql: "SELECT HEX(ciclo_lectivo_id) AS cicloId FROM school_calificaciones WHERE id = UNHEX(:id) LIMIT 1",
    replacements: { id: databaseId(id) },
  }),
};

export const cycleIdFromBody = (req) => req.body?.cicloLectivoId;
export const cycleIdFromParam = (req) => req.params.id;
export const cycleIdFromClassBody = async (req) => {
  const { claseId } = req.body ?? {};
  return lookupCycleId("clase", claseId);
};
export const cycleIdFromClassParam = (req) => lookupCycleId("clase", req.params.id);
export const cycleIdFromTaskBody = async (req) => {
  return lookupCycleId("tarea", req.body?.tareaId ?? req.body?.tarea);
};
export const cycleIdFromTaskParam = (req) => lookupCycleId("tarea", req.params.id);
export const cycleIdFromFeeParam = (req) => lookupCycleId("cuota", req.params.id);
export const cycleIdFromDeliveryParam = (req) => lookupCycleId("entrega", req.params.id);
export const cycleIdFromNoteBody = (req) => lookupCycleId("nota", req.body?.notaId);
export const cycleIdFromGradeParam = (req) => lookupCycleId("calificacion", req.params.id);

const lookupCycleId = async (entity, id) => {
  if (!id) return undefined;
  if (!isDatabaseId(id)) {
    const error = new Error("ID de registro inválido.");
    error.status = 400;
    throw error;
  }
  const { sql, replacements } = cycleLookup[entity](id);
  const [row] = await queryRows(sql, replacements);
  if (!row) {
    const error = new Error("Registro no encontrado.");
    error.status = 404;
    throw error;
  }
  if (!row.cicloId) {
    const error = new Error("El registro todavía no está vinculado a un ciclo lectivo.");
    error.status = 409;
    throw error;
  }
  return row.cicloId;
};

export const cycleWriteGuard = (resolveCycleId, options) => async (req, res, next) => {
  try {
    const cycleId = await resolveCycleId(req);
    const cycle = cycleId ? await getCycleById(cycleId) : await getActiveCycle();
    assertCycleWritable(cycle, options);
    req.cicloLectivo = cycle;
    return next();
  } catch (error) {
    if (req.file?.path) {
      try {
        await unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("No se pudo limpiar el archivo rechazado:", cleanupError);
        }
      }
    }
    if (error.status) return res.status(error.status).json({ msg: error.message });
    console.error("Error validando el ciclo lectivo de la operación:", error);
    return res.status(500).json({ msg: "No se pudo validar el ciclo lectivo." });
  }
};
