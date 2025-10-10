import express from "express";
import { body } from "express-validator";

import {
  crearCalificacion,
  obtenerCalificacionesPorMateria,
  obtenerCalificacionesAlumno,
  actualizarCalificacion,
  eliminarCalificacion,
} from "../controllers/calificacion.controller.js";

import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { validateFields } from "../middlewares/validateFields.js";

const router = express.Router();

// ✅ Crear calificación (solo profesor)
router.post(
  "/",
  [
    checkAuth,
    checkRole("profesor"),
    body("materia", "La materia es obligatoria").notEmpty(),
    body("alumno", "El alumno es obligatorio").notEmpty(),
    body("descripcion", "La descripción es obligatoria").notEmpty(),
    body("nota", "La nota debe ser un número válido").isFloat({ min: 1, max: 10 }),
    validateFields,
  ],
  crearCalificacion
);

// ✅ Ver calificaciones por materia (solo profesor)
router.get(
  "/materia/:idMateria",
  checkAuth,
  checkRole("profesor"),
  obtenerCalificacionesPorMateria
);

// ✅ Ver mis calificaciones (alumno)
router.get(
  "/mis-calificaciones",
  checkAuth,
  checkRole("alumno"),
  obtenerCalificacionesAlumno
);

router.put(
  "/:id",
  checkAuth,
  checkRole("profesor"),
  [
    body("nota", "La nota es obligatoria").notEmpty().isFloat({ min: 1, max: 10 }),
    validateFields,
  ],
  actualizarCalificacion
);

router.delete("/:id", checkAuth, checkRole("profesor"), eliminarCalificacion)

export default router;
