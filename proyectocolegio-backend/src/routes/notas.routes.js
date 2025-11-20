// src/routes/notas.routes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js"; // <--- ASEGÚRATE DE TENER LAS LLAVES {}
import { checkRole } from "../middlewares/checkRole.js"; // <--- ASEGÚRATE DE TENER LAS LLAVES {}
import {
  guardarNota,
  getNotasPorMateriaTrimestre,
  misNotasAlumno,
  getAuditoriaNotas,
  cambiarEstadoTrimestre // <--- IMPORTAR ESTA NUEVA FUNCIÓN
} from "../controllers/notas.controller.js";

const router = Router();

const logNotasRoute = (req, res, next) => {
  console.log(`--- DEBUG Router Notas --- Accediendo a ${req.method} ${req.originalUrl}`);
  next();
};

// 1. GUARDAR NOTA (Profesor carga / Admin corrige)
router.post(
  "/guardar-una",
  logNotasRoute,
  checkAuth,
  checkRole("profesor", "admin"), 
  guardarNota
);

// 2. VER GRILLA (Profesor ve su curso / Admin supervisa)
router.get(
  "/materia/:id",
  logNotasRoute,
  checkAuth,
  checkRole("profesor", "admin"), 
  getNotasPorMateriaTrimestre 
);

// 3. VER BOLETÍN (Alumno)
router.get(
  "/mias",
  logNotasRoute,
  checkAuth,
  checkRole("alumno"), 
  misNotasAlumno
);

// 4. AUDITORÍA (Solo Admin)
router.get(
  "/auditoria",
  logNotasRoute,
  checkAuth,
  checkRole("admin"), 
  getAuditoriaNotas
);

// 5. APROBAR/BLOQUEAR TRIMESTRE (Solo Admin) - ¡IMPORTANTE!
// Esta ruta faltaba y es necesaria para cerrar el ciclo.
router.post(
    "/cambiar-estado",
    checkAuth,
    checkRole("admin"),
    cambiarEstadoTrimestre
);

export default router;