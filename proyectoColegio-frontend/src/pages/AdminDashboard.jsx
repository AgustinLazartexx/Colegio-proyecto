import { Outlet } from "react-router-dom";
import SidebarAdmin from "../components/sidebar/SidebarAdmin";

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarAdmin />
      <main className="flex-1 p-6">
        <Outlet /> {/* Aquí se renderizan las rutas hijas */}
      </main>
    </div>
  );
};

export default AdminDashboard;
