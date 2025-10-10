import { Router } from "express";
import { getMateriasPorAlumno } from "../controllers/materia.controller.js";
const router = Router();

router.get("/alumno/:id", getMateriasPorAlumno);

export default router;
