import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/mariadb.js";
import {
  findUserByEmail,
  toPublicUser,
} from "../services/userAuth.service.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    if (!user.isActive) {
      return res.status(403).json({ msg: "Usuario deshabilitado." });
    }

    if (user.rol === "alumno" && !user.acceso_habilitado) {
      return res.status(403).json({
        msg: "Acceso restringido por estado de cuenta. Contacte administración.",
      });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: "4h" },
    );

    return res.json({
      msg: "Login exitoso",
      user: toPublicUser(user),
      token,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ msg: "Error del servidor" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const users = await sequelize.query(
      "SELECT HEX(id) AS id, email, nombre FROM users WHERE email = :email LIMIT 1",
      {
        replacements: { email: email.toLowerCase().trim() },
        type: QueryTypes.SELECT,
      },
    );
    const user = users[0];

    if (!user) {
      return res.json({
        msg: "Si el correo existe, recibirás un mensaje con instrucciones para restablecer tu contraseña.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await sequelize.query(
      `UPDATE users
       SET resetPasswordToken = :hashedToken, resetPasswordExpiresAt = :expiresAt
       WHERE id = UNHEX(:id)`,
      { replacements: { hashedToken, expiresAt, id: user.id } },
    );

    const frontendHost = (process.env.FRONTEND_URL || "http://localhost:5173")
      .split(",")[0]
      .trim();
    const frontendUrl = frontendHost.startsWith("http")
      ? frontendHost
      : `https://${frontendHost}`;
    const resetUrl = `${frontendUrl.replace(/\/+$/, "")}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        userName: user.nombre,
      });
    } catch (mailError) {
      console.error("Error enviando correo de recuperación:", mailError);
      return res.status(500).json({
        msg: "No se pudo enviar el correo de recuperación. Intenta nuevamente más tarde.",
      });
    }

    return res.json({
      msg: "Si el correo existe, recibirás un mensaje con instrucciones para restablecer tu contraseña.",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    return res.status(500).json({ msg: "Error del servidor al procesar la solicitud." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ msg: "El token y la nueva contraseña son obligatorios." });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const users = await sequelize.query(
      `SELECT HEX(id) AS id
       FROM users
       WHERE resetPasswordToken = :hashedToken
         AND resetPasswordExpiresAt > NOW()
       LIMIT 1`,
      { replacements: { hashedToken }, type: QueryTypes.SELECT },
    );
    const user = users[0];

    if (!user) {
      return res.status(400).json({ msg: "El token es inválido o ha expirado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await sequelize.query(
      `UPDATE users
       SET password = :passwordHash,
           resetPasswordToken = NULL,
           resetPasswordExpiresAt = NULL,
           mustChangePassword = FALSE
       WHERE id = UNHEX(:id)`,
      { replacements: { passwordHash, id: user.id } },
    );

    return res.json({ msg: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    return res.status(500).json({ msg: "Error del servidor al restablecer la contraseña." });
  }
};

export const verifyUser = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.json({
    msg: "Token válido.",
    user: toPublicUser(req.user),
  });
};
