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
  asignarAlumno,
  desasignarAlumno,
  listarAlumnosDeClase,
  getMisClasesAlumno,
} from "../controllers/clase.controller.js";

const router = Router();

// Middlewares de rol
const adminSolo = [checkAuth, checkRole("admin")];
const adminProfesor = [checkAuth, checkRole("admin", "profesor")];
const profesorSolo = [checkAuth, checkRole("profesor")];

// --- Rutas Generales ---
router.get("/", adminSolo, obtenerTodasLasClases);
router.get("/misclases", profesorSolo, obtenerClasesProfesor);
router.post("/", adminSolo, crearClase);
router.get("/alumno/mis-clases", checkAuth, getMisClasesAlumno);

// --- Rutas Específicas por ID ---
// NOTA: Tu controlador lee 'req.params.claseId', así que usamos ':claseId'
router.get("/:claseId", adminProfesor, obtenerClasePorId); 
router.put("/:id", adminSolo, actualizarClase); // Este controlador lee 'id'
router.delete("/:id", adminSolo, eliminarClase); // Este controlador lee 'id'

// --- Gestión de Alumnos en Clases ---
// El controlador 'asignarAlumno' lee 'id' (de la clase)
router.post("/:id/alumnos", adminSolo, asignarAlumno);
router.delete("/:id/alumnos/:alumnoId", adminSolo, desasignarAlumno);
router.get("/:id/alumnos", adminProfesor, listarAlumnosDeClase);

export default router;