// src/pages/AlumnoDashboard.jsx
import { Outlet } from "react-router-dom";
import SidebarAlumno from "../components/sidebar/SidebarAlumno";

const AlumnoDashboard = () => {
  return (
    <div className="flex">
      <SidebarAlumno />
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AlumnoDashboard;
