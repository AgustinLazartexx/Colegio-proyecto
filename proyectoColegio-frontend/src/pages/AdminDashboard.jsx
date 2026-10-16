import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

// IMPORTANTE: Verifica que esta ruta sea correcta según tus carpetas.
// Significa: "Salir de pages (../), entrar a components, entrar a sidebar..."
import SidebarAdmin from "../components/sidebar/SidebarAdmin";

const AdminDashboard = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}
      <SidebarAdmin isOpen={menuAbierto} onNavigate={() => setMenuAbierto(false)} />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
          >
            {menuAbierto ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-semibold text-slate-800">Panel de administración</span>
        </div>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;