import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  tomarAsistenciaLote,
  cargarAsistenciaSimple, // Nueva función más confiable
  listarAsistencias,
  misAsistenciasAlumno,
  actualizarAsistencia,
  eliminarAsistencia,
  tomarAsistenciaPorAula,        // 🆕 nuevo
  listarAsistenciasPorAula
} from "../controllers/asistencia.controller.js";

const router = Router();

// === PROFESOR ===
router.post("/tomar", [checkAuth, checkRole("profesor")], tomarAsistenciaLote);
router.post("/cargar", [checkAuth, checkRole("profesor")], cargarAsistenciaSimple);

// === ADMIN ===
router.post("/aula/tomar", [checkAuth, checkRole("admin")], tomarAsistenciaPorAula);
router.get("/aula", [checkAuth, checkRole("admin")], listarAsistenciasPorAula);

// === GENERAL ===
router.get("/", [checkAuth, checkRole(["admin", "profesor"])], listarAsistencias);
router.get("/mias", [checkAuth, checkRole("alumno")], misAsistenciasAlumno);
router.put("/:id", [checkAuth, checkRole(["admin", "profesor"])], actualizarAsistencia);
router.delete("/:id", [checkAuth, checkRole("admin")], eliminarAsistencia);

export default router;