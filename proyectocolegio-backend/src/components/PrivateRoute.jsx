import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { usuario } = useContext(AuthContext);
  const location = useLocation();

  if (!usuario) {
    // Si no está autenticado, redirige al login
   return <Navigate to="/" state={{ from: location }} replace />;

  }

  const rol = usuario.rol;

  if (allowedRoles.length && !allowedRoles.includes(rol)) {
    // Si no tiene el rol permitido, redirige a "no autorizado"
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo ok, renderiza el componente hijo
  return children;
};

export default PrivateRoute;
