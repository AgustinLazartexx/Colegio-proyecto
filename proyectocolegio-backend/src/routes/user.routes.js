// src/routes/user.routes.js
import express from "express";
import { body, check } from "express-validator"; // Mantenemos validator si lo usas
import {
  login,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  adminCrearUsuario, // <-- Nueva
  cambiarPassword    // <-- Nueva
} from "../controllers/user.controller.js";

import { validateFields } from "../middlewares/validateFields.js"; // Si lo usas
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";

const router = express.Router();

// --- RUTA PÚBLICA ---
router.post("/login", [ /* validaciones opcionales */ ], login);

// --- RUTA DE REGISTRO PÚBLICO ELIMINADA ---
// router.post("/register", [ ... ], registerUser); 

// --- RUTAS PROTEGIDAS ---

// Cambiar Contraseña (Cualquier usuario logueado)
router.put(
    "/cambiar-password",
    [
        checkAuth, // Solo necesita estar logueado
        // Validaciones para las contraseñas
        body('currentPassword', 'La contraseña actual es requerida').notEmpty(),
        body('newPassword', 'La nueva contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
        validateFields // Ejecuta las validaciones
    ],
    cambiarPassword
);

// --- RUTAS SOLO PARA ADMIN ---

// Crear un nuevo usuario (cualquier rol)
router.post(
    "/admin/crear",
    [
        checkAuth,
        checkRole("admin"),
        // Añadir validaciones de express-validator aquí si prefieres
        body('nombre').notEmpty().withMessage('Nombre requerido'),
        body('email').isEmail().withMessage('Email inválido'),
        body('dni').notEmpty().withMessage('DNI requerido'),
        body('rol').isIn(['admin', 'profesor', 'alumno']).withMessage('Rol inválido'),
        // Validaciones condicionales para alumno
        body('anio').if(body('rol').equals('alumno')).notEmpty().isInt({min:1, max:6}).withMessage('Año inválido para alumno'),
        body('division').if(body('rol').equals('alumno')).notEmpty().isLength({min:1, max:1}).withMessage('División inválida para alumno'),
        validateFields
    ],
    adminCrearUsuario
);

// Obtener todos los usuarios
router.get("/", [checkAuth, checkRole("admin")], getUsers);

// Obtener un usuario por ID
router.get("/:id", [checkAuth, checkRole("admin")], getUserById);

// Eliminar (o deshabilitar) un usuario
router.delete("/:id", [checkAuth, checkRole("admin")], deleteUser);

// Actualizar un usuario
router.put(
  "/:id",
  [
    checkAuth,
    checkRole("admin"),
    // Validaciones opcionales para los campos que permites actualizar
    body("nombre").optional().notEmpty(),
    body("email").optional().isEmail(),
    body("rol").optional().isIn(["alumno", "profesor", "admin"]),
    body("anio").optional().isInt({min:1, max:6}),
    body("division").optional().isLength({min:1, max:1}),
    body("isActive").optional().isBoolean(),
    body("dni").optional().notEmpty(),
    validateFields,
  ],
  updateUser
);

export default router;