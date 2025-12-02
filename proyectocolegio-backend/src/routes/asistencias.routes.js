import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  registrarAsistencias,
  obtenerAsistenciasPorClaseYFecha,
  obtenerAsistenciasPorAlumno,
  getReporteAsistencias,
  getMisAsistencias
} from "../controllers/asistencia.controller.js";

const router = Router();

// RUTA NUEVA PARA EL ALUMNO
router.get("/alumno/mis-asistencias", checkAuth, getMisAsistencias);


// Registrar (Tomar) asistencia
router.post('/', checkAuth, checkRole(['admin', 'profesor']), registrarAsistencias);

// Consultar asistencia de un día (para profesor/admin)
router.get('/', checkAuth, checkRole(['admin', 'profesor']), obtenerAsistenciasPorClaseYFecha);

// Historial del alumno (para el alumno mismo)
router.get('/alumno', checkAuth, checkRole(['alumno']), obtenerAsistenciasPorAlumno);

// Historial de un alumno específico (para admin)
router.get('/alumno/:alumnoId', checkAuth, checkRole(['admin']), obtenerAsistenciasPorAlumno);

// Reporte detallado (agregado)
router.get('/reporte-detallado', checkAuth, checkRole(['admin', 'profesor']), getReporteAsistencias);


export default router;