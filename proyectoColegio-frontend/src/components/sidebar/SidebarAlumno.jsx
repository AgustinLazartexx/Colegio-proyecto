import {
  // --- Íconos seleccionados para cada link ---
  Home,
  BookOpen,
  ClipboardList,
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
  { to: "/alumno/materias", icon: BookOpen, text: "Materias" },
  { to: "/alumno/tareas", icon: ClipboardList, text: "Tareas" },
  { to: "/alumno/inscripcion", icon: PenSquare, text: "Inscripción a Materias" },
  { to: "/alumno/examenes", icon: Megaphone, text: "Anuncios" },
];

// --- No hay cambios en el resto del código, es reutilizable ---

const NavItem = ({ to, icon: Icon, text }) => (
  <NavLink
    to={to}
    end={to === "/alumno"}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-slate-300 ${
        isActive
          ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg"
          : "hover:bg-slate-700/50 hover:text-white"
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium tracking-wide">{text}</span>
  </NavLink>
);

const SidebarAlumno = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="w-72 bg-slate-900/80 backdrop-blur-lg text-white min-h-screen shadow-2xl p-4 flex flex-col">
      <div className="flex items-center gap-3 p-4 mb-6 border-b border-slate-700">
        <ShieldCheck className="text-sky-400" size={32} />
        <h1 className="text-xl font-bold tracking-wider text-white">
          Portal Alumno
        </h1>
      </div>

      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-slate-700 space-y-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <img
            src={`https://ui-avatars.com/api/?name=${usuario?.nombre || 'A'}&background=random`}
            alt="Avatar del alumno"
            className="w-10 h-10 rounded-full border-2 border-slate-600"
          />
          <div>
            <p className="font-semibold text-white text-sm">{usuario?.nombre || "Alumno"}</p>
            <span className="text-xs text-slate-400">Rol: Alumno</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
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