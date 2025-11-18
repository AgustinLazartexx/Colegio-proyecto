export const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    // 1. Verificar si checkAuth hizo su trabajo
    if (!req.user) {
      console.log("!!! checkRole: req.user no existe. ¿Pasaste por checkAuth?");
      return res.status(401).json({ msg: "No autenticado (Token inválido o expirado)" });
    }

    // 2. Aplanar los roles por si se pasaron como arrays o strings sueltos
    // Esto permite usar checkRole("admin") O checkRole(["admin"])
    const roles = rolesPermitidos.flat();

    console.log(`--- DEBUG ROL ---`);
    console.log(`Rol del Usuario: ${req.user.rol}`);
    console.log(`Roles Permitidos: ${roles}`);

    // 3. Verificar si el rol del usuario está en la lista permitida
    if (roles.includes(req.user.rol)) {
      next();
    } else {
      console.log("!!! checkRole: Acceso Denegado.");
      return res.status(403).json({ 
        msg: `No tienes permisos. Se requiere: ${roles.join(" o ")}` 
      });
    }
  };
};