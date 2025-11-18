// src/routes/alumnos.routes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { listarAlumnosPorCurso } from "../controllers/alumnos.controller.js"; // Importamos el controlador

const router = Router();

// 🔹 Obtener alumnos filtrando por año y división
router.get(
  "/", 
  [checkAuth, checkRole(["admin", "profesor"])], 
  listarAlumnosPorCurso // Usamos la función del controlador
);

export default router;