// src/routes/notas.routes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  guardarNota,
  getNotasPorMateriaTrimestre,
  misNotasAlumno,
  getAuditoriaNotas
} from "../controllers/notas.controller.js";

const router = Router();

const logNotasRoute = (req, res, next) => {
  console.log(`--- DEBUG Router Notas --- Accediendo a ${req.method} ${req.originalUrl}`);
  next();
};

// Profesor Y Admin guardan notas
router.post(
  "/guardar-una",
  logNotasRoute,
  checkAuth,
  // --- CAMBIO ---
  checkRole("profesor", "admin"), // Roles como argumentos separados
  // --- FIN CAMBIO ---
  guardarNota
);

// Profesor Y Admin ven la grilla
router.get(
  "/materia/:id",
  logNotasRoute,
  checkAuth,
  // --- CAMBIO ---
  checkRole("profesor", "admin"), // Roles como argumentos separados
  // --- FIN CAMBIO ---
  getNotasPorMateriaTrimestre 
);

// Alumno ve su boletín
router.get(
  "/mias",
  logNotasRoute,
  checkAuth,
  checkRole("alumno"), // Aquí está bien porque es un solo rol
  misNotasAlumno
);

// Admin ve el log de cambios
router.get(
  "/auditoria",
  logNotasRoute,
  checkAuth,
  checkRole("admin"), // Aquí está bien
  getAuditoriaNotas
);

export default router;