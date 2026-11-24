import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  cycleIdFromBody,
  cycleIdFromClassParam,
  cycleWriteGuard,
} from "../middlewares/cycleWrite.js";
import {
  crearClase,
  actualizarClase,
  cambiarEstadoClase,
  obtenerTodasLasClases,
  obtenerClasesProfesor,
  obtenerClasePorId,
  asignarAlumno,
  cambiarEstadoAlumno,
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
router.post("/", adminSolo, cycleWriteGuard(cycleIdFromBody, { allowPlanned: true }), crearClase);
router.get("/alumno/mis-clases", checkAuth, checkRole("alumno"), getMisClasesAlumno);

// --- Rutas Específicas por ID ---
// NOTA: Tu controlador lee 'req.params.claseId', así que usamos ':claseId'
router.get("/:claseId", adminProfesor, obtenerClasePorId); 
router.put("/:id", adminSolo, cycleWriteGuard(cycleIdFromClassParam, { allowPlanned: true }), actualizarClase); // Este controlador lee 'id'
router.put("/:id/estado", adminSolo, cycleWriteGuard(cycleIdFromClassParam, { allowPlanned: true }), cambiarEstadoClase);
router.delete("/:id", adminSolo, (_req, res) =>
  res.status(405).json({ msg: "Las clases no se pueden borrar; suspenda o reactive su estado." }),
);

// --- Gestión de Alumnos en Clases ---
// El controlador 'asignarAlumno' lee 'id' (de la clase)
router.post("/:id/alumnos", adminSolo, cycleWriteGuard(cycleIdFromClassParam, { allowPlanned: true }), asignarAlumno);
router.put("/:id/alumnos/:alumnoId/estado", adminSolo, cycleWriteGuard(cycleIdFromClassParam, { allowPlanned: true }), cambiarEstadoAlumno);
router.delete("/:id/alumnos/:alumnoId", adminSolo, (_req, res) =>
  res.status(405).json({ msg: "Las inscripciones no se pueden eliminar; suspenda la inscripción." }),
);
router.get("/:id/alumnos", adminProfesor, listarAlumnosDeClase);

export default router;