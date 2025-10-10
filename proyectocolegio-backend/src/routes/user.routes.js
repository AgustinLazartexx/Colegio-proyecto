import express from "express";
import { body } from "express-validator";
import {
  registerUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
} from "../controllers/user.controller.js";

import { validateFields } from "../middlewares/validateFields.js";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";

const router = express.Router();

// 🟢 Registro público
router.post(
  "/register",
  [
    body("nombre", "El nombre es obligatorio").notEmpty(),
    body("email", "Email inválido").isEmail(),
    body("password", "Mínimo 6 caracteres").isLength({ min: 6 }),
    body("rol", "Rol inválido").isIn(["alumno", "profesor", "admin"]),
    validateFields,
  ],
  registerUser
);

// 🔐 Rutas protegidas para admin
router.get("/", checkAuth, checkRole("admin"), getUsers);
router.get("/:id", checkAuth, checkRole("admin"), getUserById);
router.delete("/:id", checkAuth, checkRole("admin"), deleteUser);

// 🔄 Update protegido
router.put(
  "/:id",
  [
    checkAuth,
    checkRole("admin"),
    body("nombre", "El nombre es obligatorio").optional().notEmpty(),
    body("email", "Email inválido").optional().isEmail(),
    body("rol", "Rol inválido").optional().isIn(["alumno", "profesor", "admin"]),
    validateFields,
  ],
  updateUser
);

export default router;
