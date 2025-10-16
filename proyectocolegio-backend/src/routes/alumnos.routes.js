import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import User from "../models/User.js";

const router = Router();

// 🔹 Obtener alumnos filtrando por año y división
router.get("/", [checkAuth, checkRole(["admin", "profesor"])], async (req, res) => {
  try {
    const { anio, division } = req.query;

    if (!anio || !division) {
      return res.status(400).json({ msg: "Debe indicar año y división" });
    }

    const alumnos = await User.find({
      rol: "alumno",
      anio: parseInt(anio),
      division: division.toUpperCase(),
    }).select("nombre email anio division");

    res.json(alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    res.status(500).json({ msg: "Error al obtener alumnos" });
  }
});

export default router;
