import express from "express";
import { body } from "express-validator";
import {
  crearMateria,
  obtenerMaterias, // Función unificada
  obtenerMateria,
  obtenerMateriasPorAnio,
  actualizarMateria,
  eliminarMateria,
  inscribirseAMateria,
  verAlumnosMateria,
  verAlumnosPorProfesor,
  obtenerProfesores
// ELIMINADA: obtenerMateriasFiltradas
} from "../controllers/materia.controller.js";

import { validateFields } from "../middlewares/validateFields.js";
import { checkRole } from "../middlewares/checkRole.js";
import { obtenerMateriasDelProfesor } from "../controllers/materia.controller.js";
import { checkAuth, esAdmin } from "../middlewares/checkAuth.js"; // 'esAdmin' no parece estar definido, pero sigo tu import
const router = express.Router();

// Admin crea materia
router.post(
"/",
  [
    checkAuth,
    checkRole("admin"),
    body("nombre", "Nombre obligatorio").notEmpty(),
    body("anio", "Año inválido (0-6)").isInt({ min: 0, max: 6 }),
    // La validación de 'division' se hace en el controlador
    validateFields,
  ],
  crearMateria
);


// Rutas específicas primero
// --- RUTA CORREGIDA ---
// Esta ruta ahora maneja "GET /" y "GET /?anio=1", etc.
router.get("/", checkAuth, obtenerMaterias); 
// --- FIN CORRECCIÓN ---

router.get("/profesor/alumnos", checkAuth, checkRole("profesor"), verAlumnosPorProfesor);
router.get("/profesor/materias", checkAuth, checkRole("profesor"), obtenerMateriasDelProfesor);
router.get("/profesores", checkAuth, checkRole("admin"), obtenerProfesores); // Usando checkRole
router.get("/anio/:anio", checkAuth, obtenerMateriasPorAnio);
router.post("/inscribirse/:id", checkAuth, checkRole("alumno"), inscribirseAMateria);

// Después las rutas con :id
router.get("/:id", checkAuth, obtenerMateria);
router.put("/:id", checkAuth, checkRole("admin"), actualizarMateria); // Solo Admin puede actualizar
router.delete("/:id", checkAuth, checkRole("admin"), eliminarMateria); // Solo Admin puede eliminar
router.get("/:id/alumnos", checkAuth, checkRole(["admin", "profesor"]), verAlumnosMateria); // Admin o Profesor

export default router;