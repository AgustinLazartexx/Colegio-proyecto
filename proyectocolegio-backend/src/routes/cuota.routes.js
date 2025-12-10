import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  generarCuota,
  registrarPago,
  marcarVencida,
  getCuotasPorAlumno,
  getMisCuotas
} from "../controllers/cuota.controller.js";

const router = Router();

// Rutas ADMIN (Gestión)
router.post("/generar", checkAuth, checkRole("admin"), generarCuota);
router.put("/pagar/:id", checkAuth, checkRole("admin"), registrarPago);
router.put("/vencer/:id", checkAuth, checkRole("admin"), marcarVencida);
router.get("/alumno/:id", checkAuth, checkRole("admin"), getCuotasPorAlumno);

// Ruta ALUMNO (Consulta)
router.get("/mis-cuotas", checkAuth, checkRole("alumno"), getMisCuotas);

export default router;