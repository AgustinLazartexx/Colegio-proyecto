import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  crearClase,
  actualizarClase,
  eliminarClase,
  obtenerTodasLasClases,
  obtenerClasesProfesor,
  obtenerClasePorId,
  // Importamos las funciones de alumnos
  asignarAlumno,
  desasignarAlumno,
  listarAlumnosDeClase,
} from "../controllers/clase.controller.js";

const router = Router();

const adminSolo = [checkAuth, checkRole("admin")];
const adminProfesor = [checkAuth, checkRole("admin", "profesor")];
const profesorSolo = [checkAuth, checkRole("profesor")];

// ==========================================
//             RUTAS PRINCIPALES
// ==========================================

// 1. Listar Clases
router.get("/", adminSolo, obtenerTodasLasClases);
router.get("/misclases", profesorSolo, obtenerClasesProfesor);

// 2. Gestión de Clases (CRUD)
router.post("/", adminSolo, crearClase);
router.put("/:id", adminSolo, actualizarClase);
router.delete("/:id", adminSolo, eliminarClase);


// ==========================================
//       GESTIÓN DE ALUMNOS Y DETALLES
// ==========================================

// CORRECCIÓN: Usamos ":id" en lugar de ":claseId" para consistencia con el controller
router.get("/:id", adminProfesor, obtenerClasePorId);

// Rutas de Alumnos (Usamos :id para la clase)
router.get("/:id/alumnos", adminProfesor, listarAlumnosDeClase);
router.post("/:id/alumnos", adminSolo, asignarAlumno);
router.delete("/:id/alumnos/:alumnoId", adminSolo, desasignarAlumno);

export default router;