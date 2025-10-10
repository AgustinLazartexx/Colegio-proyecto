import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  upsertNotas,
  listarNotas,
  misNotasAlumno,
  cargarNotas
} from "../controllers/notas.controller.js";

const router = Router();

// Profesor crea/actualiza (upsert) notas por alumno
router.put("/upsert", [checkAuth, checkRole("profesor")], upsertNotas);

// Admin y Profesor (limitado) listan
router.get("/", [checkAuth, checkRole(["admin", "profesor"])], listarNotas);

// Alumno ve sus notas
router.get("/mias", [checkAuth, checkRole("alumno")], misNotasAlumno);

router.post("/cargar", [checkAuth, checkRole("profesor")], cargarNotas);

export default router;
