import jwt from "jsonwebtoken";

// Verifica si el token es válido y extrae info del usuario
export const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No autorizado, token faltante" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;         // Info completa del usuario
    req.uid = decoded.id;       // ID del usuario
    req.rol = decoded.rol;      // Rol del usuario: "admin", "profesor", "alumno"

    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

// Middleware para verificar si es admin
export const esAdmin = (req, res, next) => {
  if (req.rol !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado: solo para administradores" });
  }
  next();
};
