// src/routes/materia.routes.js
import express from "express";
import { body } from "express-validator";
import {
  crearMateria,
  obtenerMaterias,
  obtenerMateria,
  obtenerMateriasPorAnio,
  actualizarMateria,
  eliminarMateria,
  inscribirseAMateria,
  verAlumnosMateria,
  verAlumnosPorProfesor,
  obtenerProfesores,
  obtenerMateriasFiltradas
} from "../controllers/materia.controller.js";

import { validateFields } from "../middlewares/validateFields.js";
import { checkRole } from "../middlewares/checkRole.js";
import { obtenerMateriasDelProfesor } from "../controllers/materia.controller.js";
import { checkAuth, esAdmin } from "../middlewares/checkAuth.js";
const router = express.Router();

// Admin crea materia
router.post(
  "/",
  [
    checkAuth,
    checkRole("admin"),
    body("nombre", "Nombre obligatorio").notEmpty(),
    body("anio", "Año inválido").isInt({ min: 1, max: 6 }),
    validateFields,
  ],
  crearMateria
);


// Rutas específicas primero
router.get("/", checkAuth, obtenerMaterias);
router.get("/", checkAuth, obtenerMateriasFiltradas);
router.get("/profesor/alumnos", checkAuth, checkRole("profesor"), verAlumnosPorProfesor);
router.get("/profesor/materias", checkAuth, checkRole("profesor"), obtenerMateriasDelProfesor);
router.get("/profesores", checkAuth, esAdmin, obtenerProfesores);
router.get("/anio/:anio", checkAuth, obtenerMateriasPorAnio);
router.post("/inscribirse/:id", checkAuth, checkRole("alumno"), inscribirseAMateria);

// Después las rutas con :id
router.get("/:id", checkAuth, obtenerMateria);
router.put("/:id", checkAuth, actualizarMateria);
router.delete("/:id", checkAuth, eliminarMateria);
router.get("/:id/alumnos", checkAuth, verAlumnosMateria);

export default router;
