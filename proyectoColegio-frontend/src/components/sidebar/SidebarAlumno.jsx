import { createElement } from "react";
import {
  // --- Íconos seleccionados para cada link ---
  Home,
  BookOpen,
  ClipboardList,
  FileText,
  PenSquare,
  Megaphone,
  Layers,
} from "lucide-react";
import { NavLink } from "react-router-dom";

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

const NavItem = ({ to, icon, text, onNavigate }) => (
  <NavLink
    to={to}
    end={to === "/alumno"}
    onClick={onNavigate}
    className={({ isActive }) =>
      `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
        isActive
          ? "bg-blue-50 text-secondary ring-1 ring-inset ring-blue-100"
          : "text-slate-600 hover:bg-canvas hover:text-navy"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-secondary" />}
        {createElement(icon, { size: 19, "aria-hidden": true, className: "shrink-0" })}
        <span>{text}</span>
      </>
    )}
  </NavLink>
);

const SidebarAlumno = ({ isOpen = false, onNavigate = () => {} }) => {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white text-navy shadow-xl shadow-slate-900/10 transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex min-h-[4.5rem] items-center gap-3 border-b border-slate-100 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-secondary ring-1 ring-blue-100">
          <BookOpen size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-tight text-navy">Colegio Reina</p>
          <p className="text-[11px] font-medium text-slate-500">Portal del alumno</p>
        </div>
      </div>

      <nav aria-label="Navegación del alumno" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Principal</p>
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-warm px-3 py-2.5">
          <Layers size={16} className="shrink-0 text-accent" aria-hidden="true" />
          <span className="text-xs font-medium text-slate-500">Gestión escolar</span>
        </div>
      </div>
    </aside>
  );
};

export default SidebarAlumno;