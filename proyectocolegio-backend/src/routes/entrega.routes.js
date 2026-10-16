import express from "express";
import { param, body } from "express-validator";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { validateFields } from "../middlewares/validateFields.js";
import { uploadEntrega } from "../middlewares/uploadEntrega.js";
import { 
  subirEntrega, 
  obtenerEntregasPorTarea, 
  corregirEntrega,
  obtenerEntregasAlumno,
} from "../controllers/entrega.controller.js";

const router = express.Router();
const validarEntrega = [
  checkAuth,
  checkRole("profesor", "admin"),
  param("id", "ID de entrega inválido").matches(/^[\da-f]{32}$/i),
  body("nota", "La nota debe ser un número entre 0 y 10")
    .optional()
    .isFloat({ min: 0, max: 10 }),
  body("comentario", "El comentario debe ser texto")
    .optional()
    .isString()
    .trim(),
  validateFields,
];

// 🔄 RUTA EXISTENTE: subir entrega de tarea (solo alumnos)
router.post("/", [
  checkAuth,
  checkRole("alumno"), // Solo alumnos pueden subir entregas
  uploadEntrega.single("archivo"),
], subirEntrega);

// 🆕 MEJORADA: obtener entregas por tarea - ruta principal que usa tu frontend
router.get("/:tareaId", [
  checkAuth,
  checkRole("profesor", "admin"), // Solo profesores pueden ver entregas
  param("tareaId", "ID de tarea inválido").matches(/^[\da-f]{32}$/i),
  validateFields,
], obtenerEntregasPorTarea);

// 🆕 NUEVA: ruta alternativa para compatibilidad (tu frontend la intenta)
router.get("/tarea/:tareaId", [
  checkAuth,
  checkRole("profesor", "admin"),
  param("tareaId", "ID de tarea inválido").matches(/^[\da-f]{32}$/i),
  validateFields,
], obtenerEntregasPorTarea);

// 🆕 MEJORADA: corregir entrega con validaciones
router.put("/:id", validarEntrega, corregirEntrega);
router.put("/:id/calificar", validarEntrega, corregirEntrega);

router.get("/alumno/mis-entregas", checkAuth, checkRole("alumno"), obtenerEntregasAlumno);

export default router;