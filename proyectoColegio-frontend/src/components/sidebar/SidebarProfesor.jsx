import {
  // --- Íconos actualizados ---
  Home,
  BookOpen,
  Users,
  ClipboardCheck,
  Upload,
  Megaphone,
  FilePenLine,
  CalendarCheck,
  GraduationCap,
  // --- Íconos del resto del componente ---
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Array de navegación con un ícono único para cada elemento
const navItems = [
  { to: "/profesor", icon: Home, text: "Inicio" },
  { to: "/profesor/clases", icon: BookOpen, text: "Clases" },
  { to: "/profesor/profesor/ver-alumnos", icon: Users, text: "Alumnos" },
  { to: "/profesor/verEntregas", icon: ClipboardCheck, text: "Tareas" },
  { to: "/profesor/cargar-tarea", icon: Upload, text: "Cargar Tarea" },
  { to: "/profesor/mensajes", icon: Megaphone, text: "Anuncios" },
  { to: "/profesor/crud-anuncios", icon: FilePenLine, text: "Administrar Anuncios" },
  { to: "/profesor/tomar-asistencia", icon: CalendarCheck, text: "Tomar Asistencia" },
  { to: "/profesor/cargar-notas", icon: GraduationCap, text: "Subir Notas" },
];

// --- No hay cambios en el resto del código ---

// Componente de item de navegación
const NavItem = ({ to, icon: Icon, text }) => (
  <NavLink
    to={to}
    end={to === "/profesor"}
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

const SidebarProfesor = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="w-72 bg-slate-900/80 backdrop-blur-lg text-white min-h-screen shadow-2xl p-4 flex flex-col">
      {/* Encabezado del Sidebar */}
      <div className="flex items-center gap-3 p-4 mb-6 border-b border-slate-700">
        <ShieldCheck className="text-sky-400" size={32} />
        <h1 className="text-xl font-bold tracking-wider text-white">
          Panel Docente
        </h1>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Sección de Perfil y Logout */}
      <div className="mt-auto pt-4 border-t border-slate-700 space-y-4">
        {/* Perfil de Usuario */}
        <div className="flex items-center gap-3 px-3 py-2">
          <img
            src={`https://ui-avatars.com/api/?name=${usuario?.nombre || 'P'}&background=random`}
            alt="Avatar del profesor"
            className="w-10 h-10 rounded-full border-2 border-slate-600"
          />
          <div>
            <p className="font-semibold text-white text-sm">{usuario?.nombre || "Profesor"}</p>
            <span className="text-xs text-slate-400">Rol: Profesor</span>
          </div>
        </div>

        {/* Botón de Cerrar Sesión */}
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

export default SidebarProfesor;