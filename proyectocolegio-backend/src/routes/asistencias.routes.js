// proyectocolegio-backend/src/routes/asistencias.routes.js

import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { checkRole } from '../middlewares/checkRole.js';
// Importamos los controladores CORRECTOS de asistencia
import {
  registrarAsistencias,
  obtenerAsistenciasPorClaseYFecha,
  obtenerAsistenciasPorAlumno,
} from '../controllers/asistencia.controller.js'; // Asegúrate que este controlador exista

const router = express.Router();

/**
 * @route   POST /api/asistencias
 * @desc    Registra o actualiza las asistencias para una clase y fecha.
 * @access  Admin, Profesor
 */
router.post(
  '/',
  checkAuth,
  checkRole(['admin', 'profesor']),
  registrarAsistencias
);

/**
 * @route   GET /api/asistencias
 * @desc    Obtiene las asistencias por claseId y fecha (query params)
 * @access  Admin, Profesor
 */
router.get(
  '/',
  checkAuth,
  checkRole(['admin', 'profesor']),
  obtenerAsistenciasPorClaseYFecha
);

/**
 * @route   GET /api/asistencias/alumno
 * @desc    Obtiene el historial de asistencias DEL ALUMNO LOGUEADO.
 * @access  Alumno
 */
router.get(
  '/alumno',
  checkAuth,
  checkRole(['alumno']), // Solo alumnos
  obtenerAsistenciasPorAlumno
);

/**
 * @route   GET /api/asistencias/alumno/:alumnoId
 * @desc    Obtiene el historial de asistencias de un alumno específico (para Admin).
 * @access  Admin
 */
router.get(
  '/alumno/:alumnoId',
  checkAuth,
  checkRole(['admin']), // Solo admin
  obtenerAsistenciasPorAlumno
);

export default router;