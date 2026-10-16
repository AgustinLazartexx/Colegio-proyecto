import { Outlet } from "react-router-dom";
import SidebarProfesor from "../components/sidebar/SidebarProfesor";

const ProfesorDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarProfesor />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ProfesorDashboard;
