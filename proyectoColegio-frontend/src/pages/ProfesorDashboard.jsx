import { useState } from "react";
import { Outlet } from "react-router-dom";
import RoleTopbar from "../components/RoleTopbar";
import SidebarProfesor from "../components/sidebar/SidebarProfesor";

const ProfesorDashboard = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-navy">
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-navy/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}
      <SidebarProfesor isOpen={menuAbierto} onNavigate={() => setMenuAbierto(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <RoleTopbar
          role="profesor"
          menuOpen={menuAbierto}
          onMenuClick={() => setMenuAbierto((abierto) => !abierto)}
        />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProfesorDashboard;
