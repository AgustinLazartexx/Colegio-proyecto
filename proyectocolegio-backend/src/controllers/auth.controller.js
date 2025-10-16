// src/controllers/auth.controller.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ msg: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ msg: "Contraseña incorrecta" });

    const payload = {
      id: user._id,
      rol: user.rol,
      nombre: user.nombre,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "4h",
    });

    res.json({
      msg: "Login exitoso",
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
};

// ===================================================================
// AQUÍ VA LA NUEVA FUNCIÓN QUE NECESITÁS
// ===================================================================
export const verifyUser = async (req, res) => {
  // El middleware `checkAuth` ya hizo todo el trabajo de verificar el JWT.
  // Si llegamos a esta función, el token es válido y `req.user` contiene los datos.
  
  // Buscamos el usuario en la BD para asegurarnos de que todavía existe.
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuario no encontrado, token no válido." });

  }

  res.setHeader('Cache-Control', 'no-store');

  // Devolvemos la información del usuario para restaurar la sesión en el frontend.
  return res.json({
    msg: "Token válido.",
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    }
  });
};
