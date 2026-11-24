import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { cycleIdFromBody, cycleIdFromFeeParam, cycleWriteGuard } from "../middlewares/cycleWrite.js";
import {
  generarCuota,
  registrarPago,
  marcarVencida,
  getCuotasPorAlumno,
  listarCuotasAdmin,
  getMisCuotas
} from "../controllers/cuota.controller.js";

const router = Router();

// Rutas ADMIN (Gestión)
router.post("/generar", checkAuth, checkRole("admin"), cycleWriteGuard(cycleIdFromBody), generarCuota);
router.put("/pagar/:id", checkAuth, checkRole("admin"), cycleWriteGuard(cycleIdFromFeeParam), registrarPago);
router.put("/vencer/:id", checkAuth, checkRole("admin"), cycleWriteGuard(cycleIdFromFeeParam), marcarVencida);
router.get("/admin/listado", checkAuth, checkRole("admin"), listarCuotasAdmin);
router.get("/alumno/:id", checkAuth, checkRole("admin"), getCuotasPorAlumno);

// Ruta ALUMNO (Consulta)
router.get("/mis-cuotas", checkAuth, checkRole("alumno"), getMisCuotas);

export default router;