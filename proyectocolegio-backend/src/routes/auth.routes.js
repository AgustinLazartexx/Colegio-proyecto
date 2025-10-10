// src/routes/auth.routes.js
import express from "express";
import { login } from "../controllers/auth.controller.js";
import { body } from "express-validator";
import { validateFields } from "../middlewares/validateFields.js";

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

export default router;
