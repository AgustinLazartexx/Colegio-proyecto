import express from "express";
import { param } from "express-validator";
import { 
  crearTarea,  
  obtenerTareasByProfesor 
} from "../controllers/tarea.controller.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { validateFields } from "../middlewares/validateFields.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

// Ruta existente
router.post("/", checkAuth, upload.single("archivo"), crearTarea);


// Ruta alternativa para compatibilidad
router.get("/by-profesor/:profesorId", [
  checkAuth,
  checkRole("profesor", "admin"),
  param("profesorId", "ID de profesor inválido").isMongoId(),
  validateFields,
], obtenerTareasByProfesor);

export default router;