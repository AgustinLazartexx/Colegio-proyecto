import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { 
  crearClase, 
  obtenerTodasLasClases,
  obtenerClasesProfesor,
  actualizarClase,
  eliminarClase,
  obtenerClasePorId
} from "../controllers/clase.controller.js";


const router = Router();


// Rutas para PROFESORES
// Profesor ve sus clases asignadas
router.get(
  "/misclases",
  [checkAuth, checkRole("profesor")],
  obtenerClasesProfesor
);

// Rutas para ADMIN
// Crear clase (solo admin)
router.post(
  "/",
  [checkAuth, checkRole("admin")],
  crearClase
);

// Obtener todas las clases con filtros opcionales (solo admin)
router.get(
  "/",
  [checkAuth, checkRole("admin")],
  obtenerTodasLasClases
);

// Obtener clase específica por ID (admin y profesor)
router.get(
  "/:id",
  [checkAuth, checkRole(["admin", "profesor"])],
  obtenerClasePorId
);

// Actualizar clase (solo admin)
router.put(
  "/:id",
  [checkAuth, checkRole("admin")],
  actualizarClase
);

// Eliminar clase (solo admin)
router.delete(
  "/:id",
  [checkAuth, checkRole("admin")],
  eliminarClase
);


// Rutas adicionales que podrías necesitar

// Obtener clases por materia (admin y profesor)
router.get(
  "/materia/:materiaId",
  [checkAuth, checkRole(["admin", "profesor"])],
  async (req, res) => {
    try {
      const { materiaId } = req.params;
      const clases = await Clase.find({ materia: materiaId })
        .populate("materia", "nombre")
        .populate("profesor", "nombre email")
        .sort({ diaSemana: 1, horaInicio: 1 });

      res.json({
        msg: "Clases de la materia obtenidas",
        clases,
        total: clases.length
      });
    } catch (error) {
      res.status(500).json({ msg: "Error al obtener clases", error: error.message });
    }
  }
);

// Obtener clases por año escolar (admin)
router.get(
  "/anio/:anio",
  [checkAuth, checkRole("admin")],
  async (req, res) => {
    try {
      const { anio } = req.params;
      const clases = await Clase.find({ anio: parseInt(anio) })
        .populate("materia", "nombre")
        .populate("profesor", "nombre email")
        .sort({ diaSemana: 1, horaInicio: 1 });

      res.json({
        msg: `Clases del año ${anio} obtenidas`,
        clases,
        total: clases.length,
        anio: parseInt(anio)
      });
    } catch (error) {
      res.status(500).json({ msg: "Error al obtener clases", error: error.message });
    }
  }
);

export default router;