// routes/notas.routes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  guardarNota,
  getNotasPorMateriaTrimestre,
  misNotasAlumno,
  getAuditoriaNotas // <-- NUEVO
} from "../controllers/notas.controller.js";

const router = Router();

// Profesor Y Admin guardan notas (con lógica de roles en el controlador)
router.post(
  "/guardar-una",
  [checkAuth, checkRole(["profesor", "admin"])], // <-- Acepta ambos roles
  guardarNota
);

// Profesor Y Admin ven la grilla
router.get(
  "/materia/:id",
  [checkAuth, checkRole(["profesor", "admin"])], // <-- Acepta ambos roles
  getNotasPorMateriaTrimestre
);

// Alumno ve su boletín
router.get(
  "/mias",
  [checkAuth, checkRole("alumno")],
  misNotasAlumno
);

// --- RUTA NUEVA ---
// Admin ve el log de cambios (la "alerta")
router.get(
  "/auditoria",
  [checkAuth, checkRole("admin")],
  getAuditoriaNotas
);

export default router;