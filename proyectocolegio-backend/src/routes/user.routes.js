import express from "express";
import { body, check } from "express-validator";
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
    // Validación para el nombre
    check('nombre', 'El nombre es obligatorio').not().isEmpty().trim().escape(),

    // Validación para el email
    check('email', 'Agrega un email válido').isEmail().normalizeEmail(),

    // Validación para la contraseña
    check('password', 'La contraseña debe tener al menos 8 caracteres')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
      .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número.'),

    // Validación estricta para el rol
    check('rol', 'Rol no válido').isIn(['alumno', 'profesor', 'admin']),
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
