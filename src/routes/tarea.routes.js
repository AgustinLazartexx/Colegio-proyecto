import express from "express";
import { param } from "express-validator";
import { 
  crearTarea,
  obtenerTareasPorMateria,
  obtenerTareasPorClase,
  obtenerTareasByProfesor,
  eliminarTarea,
} from "../controllers/tarea.controller.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { validateFields } from "../middlewares/validateFields.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

import {
  cycleIdFromBody,
  cycleIdFromTaskParam,
  cycleWriteGuard,
} from "../middlewares/cycleWrite.js";

router.post("/", checkAuth, checkRole("profesor"), upload.single("archivo"), cycleWriteGuard(cycleIdFromBody), crearTarea);

router.get("/profesor", checkAuth, checkRole("profesor", "admin"), obtenerTareasByProfesor);
router.get("/by-profesor/:profesorId", [
  checkAuth,
  checkRole("profesor", "admin"),
  param("profesorId", "ID de profesor inválido").matches(/^[\da-f]{32}$/i),
  validateFields,
], obtenerTareasByProfesor);
router.get("/materia/:materiaId", checkAuth, obtenerTareasPorMateria);
router.get("/clase/:claseId", checkAuth, obtenerTareasPorClase);
router.delete("/:id", checkAuth, checkRole("profesor", "admin"), cycleWriteGuard(cycleIdFromTaskParam), eliminarTarea);

export default router;