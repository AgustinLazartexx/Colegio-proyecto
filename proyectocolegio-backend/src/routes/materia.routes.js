import express from "express";
import { body } from "express-validator";
import {
  crearMateria,
  obtenerMateria, // Obtener una por ID
  obtenerMateriasFiltradas, // Usaremos esta como la principal para GET /
  actualizarMateria,
  eliminarMateria,
  inscribirseAMateria,
  verAlumnosMateria,
  verAlumnosPorProfesor,
  obtenerProfesores,
  obtenerMateriasDelProfesor // Importamos la función del profesor
} from "../controllers/materia.controller.js";

import { validateFields } from "../middlewares/validateFields.js";
import { checkRole } from "../middlewares/checkRole.js";
import { checkAuth, esAdmin } from "../middlewares/checkAuth.js";

const router = express.Router();

// --- RUTAS DE GESTIÓN (ADMIN) ---
router.post(
  "/",
  [
    checkAuth,
    checkRole("admin"),
    body("nombre", "Nombre obligatorio").notEmpty(),
    body("anio", "Año inválido").isInt({ min: 0, max: 6 }),
    validateFields,
  ],
  crearMateria
);

// --- RUTAS DE LISTADO ---

// 1. (PROFESOR) Mis materias
// IMPORTANTE: Esta ruta debe ir ANTES de las rutas con :id
router.get(
  "/profesor/listado", 
  checkAuth, 
  checkRole("profesor"), 
  obtenerMateriasDelProfesor
);

// 2. (GENERAL/ADMIN) Obtener todas (con opción de filtros ?anio=X)
// Fusionamos las dos rutas GET / anteriores en esta sola
router.get("/", checkAuth, obtenerMateriasFiltradas);


// --- RUTAS ESPECÍFICAS ---
router.get("/profesor/alumnos", checkAuth, checkRole("profesor"), verAlumnosPorProfesor);
router.get("/profesores", checkAuth, esAdmin, obtenerProfesores);
router.post("/inscribirse/:id", checkAuth, checkRole("alumno"), inscribirseAMateria);


// --- RUTAS CON PARÁMETRO ID (Siempre al final) ---
router.get("/:id", checkAuth, obtenerMateria);
router.put("/:id", checkAuth, actualizarMateria);
router.delete("/:id", checkAuth, eliminarMateria);
router.get("/:id/alumnos", checkAuth, verAlumnosMateria);

export default router;