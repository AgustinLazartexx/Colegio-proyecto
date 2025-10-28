// routes/clase.routes.js (Verifica que coincida con esto)
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import { 
  crearClase, 
  obtenerTodasLasClases,
  obtenerClasesProfesor, // <- Este se usa para /misclases
  actualizarClase,
  eliminarClase,
  obtenerClasePorId
} from "../controllers/clase.controller.js";
// Importa Clase para las rutas adicionales si las mantienes
import Clase from "../models/Clases.js"; 


const router = Router();

// Rutas para PROFESORES
router.get(
  "/misclases",
  [checkAuth, checkRole("profesor")],
  obtenerClasesProfesor // <- Correcto
);

// Rutas para ADMIN
router.post("/", [checkAuth, checkRole("admin")], crearClase);
router.get("/", [checkAuth, checkRole("admin")], obtenerTodasLasClases);
router.put("/:id", [checkAuth, checkRole("admin")], actualizarClase);
router.delete("/:id", [checkAuth, checkRole("admin")], eliminarClase);

// Rutas para AMBOS (Admin y Profesor dueño)
router.get("/:id", [checkAuth, checkRole("admin", "profesor")], obtenerClasePorId);

// --- RUTAS ADICIONALES (Revisar si las necesitas) ---
// Puedes mantenerlas, pero asegúrate de que la lógica dentro de ellas
// y los .populate() usen 'profesores' en lugar de 'profesor'.

// Ejemplo: Obtener clases por materia (necesita .populate('profesores'))
router.get("/materia/:materiaId", [checkAuth, checkRole("admin", "profesor")],
  async (req, res) => {
    try {
      const { materiaId } = req.params;
      const clases = await Clase.find({ materia: materiaId })
        .populate("materia", "nombre")
        .populate("profesores", "nombre email") // <-- Corregido
        .sort({ division: 1, diaSemana: 1, horaInicio: 1 });
      res.json({ msg: "Clases obtenidas", clases });
    } catch (error) { res.status(500).json({ msg: "Error", error: error.message }); }
  }
);

// Ejemplo: Obtener clases por año (necesita .populate('profesores'))
router.get("/anio/:anio", [checkAuth, checkRole("admin")],
  async (req, res) => {
    try {
      const { anio } = req.params;
      const clases = await Clase.find({ anio: parseInt(anio) })
        .populate("materia", "nombre")
        .populate("profesores", "nombre email") // <-- Corregido
        .sort({ division: 1, diaSemana: 1, horaInicio: 1 });
      res.json({ msg: `Clases del año ${anio}`, clases });
    } catch (error) { res.status(500).json({ msg: "Error", error: error.message }); }
  }
);


export default router;