import { Outlet } from "react-router-dom";

// IMPORTANTE: Verifica que esta ruta sea correcta según tus carpetas.
// Significa: "Salir de pages (../), entrar a components, entrar a sidebar..."
import SidebarAdmin from "../components/sidebar/SidebarAdmin";

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Barra Lateral */}
      <SidebarAdmin />
      
      {/* Área principal de contenido */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Aquí se cargarán DashboardAdmin, UsuariosAdmin, etc. */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminDashboard;