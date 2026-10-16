// src/routes/auth.routes.js
import express from "express";
import { forgotPassword, login, resetPassword, verifyUser } from "../controllers/auth.controller.js"; 
import { body } from "express-validator";
import { validateFields } from "../middlewares/validateFields.js";
import { checkAuth } from "../middlewares/checkAuth.js";

const router = express.Router();

router.post(
  "/login",
  [
    body("email", "Email inválido").isEmail(),
    body("password", "La contraseña es obligatoria").notEmpty(),
    validateFields,
  ],
  login
);
router.post(
  "/forgot-password",
  [
    body("email", "Email inválido").isEmail(),
    validateFields,
  ],
  forgotPassword
);
router.post(
  "/reset-password",
  [
    body("token", "Token inválido").notEmpty(),
    body("password", "La contraseña debe tener al menos 6 caracteres").isLength({ min: 6 }),
    validateFields,
  ],
  resetPassword
);
router.get("/verify", checkAuth, verifyUser);

export default router;
