// Ruta: routes/admin.routes.js
import { Router } from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";

const router = Router();

router.get("/stats", checkAuth, checkRole("admin"), getAdminStats);

export default router;
