import express from "express";
import { param, body } from "express-validator";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { validateFields } from "../middlewares/validateFields.js";
import { uploadEntrega } from "../middlewares/uploadEntrega.js";
import { 
  subirEntrega, 
  obtenerEntregasPorTarea, 
  corregirEntrega 
} from "../controllers/entrega.controller.js";

const router = express.Router();

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
  param("tareaId", "ID de tarea inválido").isMongoId(),
  validateFields,
], obtenerEntregasPorTarea);

// 🆕 NUEVA: ruta alternativa para compatibilidad (tu frontend la intenta)
router.get("/tarea/:tareaId", [
  checkAuth,
  checkRole("profesor", "admin"),
  param("tareaId", "ID de tarea inválido").isMongoId(),
  validateFields,
], obtenerEntregasPorTarea);

// 🆕 MEJORADA: corregir entrega con validaciones
router.put("/:id", [
  checkAuth,
  checkRole("profesor", "admin"), // Solo profesores pueden corregir
  param("id", "ID de entrega inválido").isMongoId(),
  body("nota", "La nota debe ser un número entre 0 y 10")
    .optional()
    .isFloat({ min: 0, max: 10 }),
  body("comentario", "El comentario debe ser texto")
    .optional()
    .isString()
    .trim(),
  validateFields,
], corregirEntrega);

// 🆕 NUEVA: obtener entregas de un alumno específico (útil para el futuro)
router.get("/alumno/mis-entregas", [
  checkAuth,
  checkRole("alumno"),
], async (req, res) => {
  try {
    const entregas = await Entrega.find({ alumno: req.user.id })
      .populate("tarea", "titulo descripcion fechaLimite")
      .populate({
        path: "tarea",
        populate: {
          path: "materia",
          select: "nombre anio"
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(entregas);
  } catch (error) {
    console.error("Error al obtener entregas del alumno:", error);
    res.status(500).json({ msg: "Error al obtener tus entregas" });
  }
});

export default router;