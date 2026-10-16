import { createElement } from "react";
import {
  // --- Íconos seleccionados para cada link ---
  Home,
  BookOpen,
  ClipboardList,
  FileText,
  PenSquare, // Más específico para "Inscripción"
  Megaphone, // Mejor para "Anuncios"
  // --- Íconos del resto del componente ---
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Asegúrate que la ruta sea correcta

// Items de navegación del Alumno
const navItems = [
  { to: "/alumno", icon: Home, text: "Inicio" },
  { to: "/alumno/asistencias", icon: ClipboardList, text: "Mis Asistencias" },
  { to: "/alumno/materias", icon: BookOpen, text: "Mis Materias" },
  { to: "/alumno/tareas", icon: FileText, text: "Mis Tareas" },
  { to: "/alumno/inscripcion", icon: PenSquare, text: "Inscripción" },
  { to: "/alumno/anuncios", icon: Megaphone, text: "Anuncios" },
  { to: "/alumno/boletin", icon: ClipboardList, text: "Mis Notas" },
];

// --- No hay cambios en el resto del código, es reutilizable ---

const NavItem = ({ to, icon, text, onNavigate }) => (
  <NavLink
    to={to}
    end={to === "/alumno"}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-slate-300 ${
        isActive
          ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg"
          : "hover:bg-slate-700/50 hover:text-white"
      }`
    }
  >
    {createElement(icon, { size: 20 })}
    <span className="font-medium tracking-wide">{text}</span>
  </NavLink>
);

const SidebarAlumno = ({ isOpen = false, onNavigate = () => {} }) => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-200 md:sticky md:inset-y-auto md:top-0 md:z-20 md:min-h-screen md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center gap-3 p-4 mb-6 border-b border-slate-700">
        <ShieldCheck className="text-sky-400" size={32} />
        <h1 className="text-xl font-bold tracking-wider text-white">
          Portal Alumno
        </h1>
      </div>

      <nav className="flex-grow space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-slate-700 space-y-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-300/30 bg-blue-500/20 font-semibold text-blue-100">
            {(usuario?.nombre || "A").split(/\s+/).map((parte) => parte[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{usuario?.nombre || "Alumno"}</p>
            <span className="text-xs text-slate-400">Rol: Alumno</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-red-800/60 hover:text-white transition-colors duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium tracking-wide">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarAlumno;