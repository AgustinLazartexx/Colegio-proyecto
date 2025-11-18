import jwt from "jsonwebtoken";
import User from "../models/User.js"; // O la ruta correcta a tu modelo User

export const checkAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscamos al usuario por ID y nos aseguramos de traer el ROL
      req.user = await User.findById(decoded.id).select("-password -confirmado -token -__v");

      if (!req.user) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }
      
      // console.log("Usuario autenticado:", req.user.nombre, "| Rol:", req.user.rol); 
      return next();

    } catch (error) {
      console.error("Error en checkAuth:", error.message);
      return res.status(404).json({ msg: "Hubo un error con la sesión" });
    }
  }

  if (!token) {
    const error = new Error("Token no válido o inexistente");
    return res.status(401).json({ msg: error.message });
  }

  next();
};
// Middleware para verificar si es admin
export const esAdmin = (req, res, next) => {
  if (req.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado: solo para administradores" });
  }
  next();
};
