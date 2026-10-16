import jwt from "jsonwebtoken";
import { findUserById, toPublicUser } from "../services/userAuth.service.js";

export const checkAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await findUserById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json({ msg: "Sesión inválida o usuario deshabilitado." });
      }

      req.user = toPublicUser(user);
      return next();

    } catch (error) {
      console.error("Error verificando sesión:", error);
      return res.status(401).json({ msg: "No se pudo verificar la sesión." });
    }
  }

  if (!token) {
    const error = new Error("Token no válido o inexistente");
    return res.status(401).json({ msg: error.message });
  }

  next();
};

export const esAdmin = (req, res, next) => {
  if (req.user?.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado: solo para administradores" });
  }
  next();
};
