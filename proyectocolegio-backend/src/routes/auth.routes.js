// src/routes/auth.routes.js
import express from "express";
import { login, verifyUser } from "../controllers/auth.controller.js"; 
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
router.get("/verify", checkAuth, verifyUser);

export default router;
