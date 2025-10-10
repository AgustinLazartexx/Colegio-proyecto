import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  tomarAsistenciaLote,
  cargarAsistenciaSimple, // Nueva función más confiable
  listarAsistencias,
  misAsistenciasAlumno,
  actualizarAsistencia,
  eliminarAsistencia
} from "../controllers/asistencia.controller.js";

const router = Router();

// Profesor toma asistencia en lote (múltiples alumnos a la vez)
router.post("/tomar", [checkAuth, checkRole("profesor")], tomarAsistenciaLote);

// Profesor carga asistencia individual (más confiable)
router.post("/cargar", [checkAuth, checkRole("profesor")], cargarAsistenciaSimple);

// Admin y Profesor (limitado a sus clases) listan
router.get("/", [checkAuth, checkRole(["admin", "profesor"])], listarAsistencias);

// Alumno ve las suyas
router.get("/mias", [checkAuth, checkRole("alumno")], misAsistenciasAlumno);

// Editar registro (profesor de esa clase o admin)
router.put("/:id", [checkAuth, checkRole(["admin", "profesor"])], actualizarAsistencia);

// Eliminar (solo admin)
router.delete("/:id", [checkAuth, checkRole("admin")], eliminarAsistencia);

export default router;