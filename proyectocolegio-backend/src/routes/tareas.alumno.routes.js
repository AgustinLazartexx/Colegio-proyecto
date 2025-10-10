import express from "express";
import { obtenerTareasPorMateria } from "../controllers/tarea.controller.js";
import { checkAuth } from "../middlewares/checkAuth.js";

const router = express.Router();

// Obtener tareas por materia (para alumnos autenticados)
router.get("/materia/:materiaId", checkAuth, obtenerTareasPorMateria);

export default router;
