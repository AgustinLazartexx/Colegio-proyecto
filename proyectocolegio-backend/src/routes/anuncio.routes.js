import { Router } from "express";
import { param } from "express-validator";
import {
  crearAnuncio,
  obtenerAnunciosAlumno,
  obtenerAnunciosProfesor,
  actualizarAnuncio,
  eliminarAnuncio
} from "../controllers/anuncio.controller.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { validateFields } from "../middlewares/validateFields.js";

const router = Router();

// Crear anuncio (solo profesor)
router.post(
  "/",
  [
    checkAuth,
    checkRole("profesor"),
    validateFields
  ],
  crearAnuncio
);

// Obtener anuncios para un alumno
router.get(
  "/alumno/:idAlumno",
  [
    checkAuth,
    checkRole("alumno"),
    param("idAlumno", "ID de alumno inválido").isMongoId(),
    validateFields
  ],
  obtenerAnunciosAlumno
);

// 📌 Obtener anuncios del profesor autenticado
router.get(
  "/profesor/mis-anuncios",
  [
    checkAuth,
    checkRole("profesor")
  ],
  obtenerAnunciosProfesor
);

// 📌 Actualizar anuncio del profesor
router.put(
  "/:id",
  [
    checkAuth,
    checkRole("profesor"),
    param("id", "ID inválido").isMongoId(),
    validateFields
  ],
  actualizarAnuncio
);

// 📌 Eliminar anuncio del profesor
router.delete(
  "/:id",
  [
    checkAuth,
    checkRole("profesor"),
    param("id", "ID inválido").isMongoId(),
    validateFields
  ],
  eliminarAnuncio
);

export default router;
