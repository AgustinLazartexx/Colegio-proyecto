import { Router } from "express";
import {
  aprobarPrevia,
  cambiarEstadoCiclo,
  cargarNotaRecuperacion,
  cerrarCiclo,
  clonarClases,
  crearCiclo,
  importarAlumnos,
  listarCiclos,
  listarRecuperacionesMateria,
  listarPrevias,
  obtenerCicloActivo,
  previewCierre,
} from "../controllers/ciclo.controller.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { cycleIdFromParam, cycleWriteGuard } from "../middlewares/cycleWrite.js";

const router = Router();

router.get("/previas/mias", checkAuth, checkRole("alumno"), listarPrevias);
router.get("/previas/:alumnoId", checkAuth, checkRole("admin"), listarPrevias);
router.patch("/previas/:id/aprobar", checkAuth, checkRole("admin"), aprobarPrevia);

router.get("/", checkAuth, checkRole("admin", "profesor", "alumno"), listarCiclos);
router.get("/activo", checkAuth, checkRole("admin", "profesor", "alumno"), obtenerCicloActivo);
router.post("/", checkAuth, checkRole("admin"), crearCiclo);
router.patch("/:id/estado", checkAuth, checkRole("admin"), cambiarEstadoCiclo);
router.get("/:id/preview-cierre", checkAuth, checkRole("admin"), previewCierre);
router.post("/:id/cerrar", checkAuth, checkRole("admin"), cerrarCiclo);
router.post("/:id/clonar-clases", checkAuth, checkRole("admin"), clonarClases);
router.post("/:id/importar-alumnos", checkAuth, checkRole("admin"), importarAlumnos);
router.get(
  "/:id/recuperaciones/:materiaId",
  checkAuth,
  checkRole("admin", "profesor"),
  listarRecuperacionesMateria,
);
router.patch(
  "/:id/recuperaciones/:materiaId/:alumnoId",
  checkAuth,
  checkRole("admin", "profesor"),
  cycleWriteGuard(cycleIdFromParam, { recoveryOnly: true }),
  cargarNotaRecuperacion,
);

export default router;
