export const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
   
    try {
      // Intentamos obtener el rol de req.rol o req.user.rol
      const rol = req.rol || (req.user && req.user.rol); 


      if (!rol || !rolesPermitidos.includes(rol)) {
        console.log("!!! checkRole FALLÓ: Rol no autorizado."); // Log ROLE 4a
        return res.status(403).json({ msg: "Acceso denegado: Rol no autorizado" });
      }

      
    } catch (err) {
      
      return res.status(500).json({ msg: "Error al verificar rol" });
    }
  };
};