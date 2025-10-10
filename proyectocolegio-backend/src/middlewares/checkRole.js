export const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      const rol = req.rol || (req.user && req.user.rol); // busca en ambos lugares

      console.log("Rol recibido:", rol);

      if (!rol || !rolesPermitidos.includes(rol)) {
        return res.status(403).json({ msg: "Acceso denegado: Rol no autorizado" });
      }

      next();
    } catch (err) {
      console.error("Error en checkRole:", err);
      return res.status(500).json({ msg: "Error al verificar rol" });
    }
  };
};
