import { Router } from "express";
import { param } from "express-validator";
import {
  crearAnuncio,
  obtenerAnunciosAlumno,
  obtenerAnunciosProfesor,
  actualizarAnuncio,
  cambiarEstadoAnuncio
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
  "/alumno/mis-anuncios",
  [
    checkAuth,
    checkRole("alumno"),
    // Ya no necesitamos validar param idAlumno
  ],
  obtenerAnunciosAlumno
)

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
    param("id", "ID inválido").matches(/^[\da-f]{32}$/i),
    validateFields
  ],
  actualizarAnuncio
);

// Los anuncios se conservan; el profesor solo puede suspenderlos o reactivarlos.
router.delete(
  "/:id",
  [
    checkAuth,
    checkRole("profesor"),
  ],
  (_req, res) => res.status(405).json({ msg: "Los anuncios no se pueden eliminar; suspenda o reactive su estado." }),
);

router.put(
  "/:id/estado",
  [
    checkAuth,
    checkRole("profesor"),
    param("id", "ID inválido").matches(/^[\da-f]{32}$/i),
    validateFields
  ],
  cambiarEstadoAnuncio
);

export default router;
