import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleDetails = {
  alumno: { label: "Portal del alumno", title: "Espacio académico" },
  profesor: { label: "Portal docente", title: "Gestión académica" },
};

const RoleTopbar = ({ role, menuOpen, onMenuClick }) => {
  const { usuario, logout } = useAuth();
  const details = roleDetails[role];
  const initials = (usuario?.nombre || details.label)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur">
      <div className="flex min-h-[4.5rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-navy transition hover:bg-blue-50 hover:text-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 md:hidden"
        >
          {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{details.label}</p>
          <p className="truncate text-sm font-bold text-navy">Colegio Reina de la Esperanza</p>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-secondary"
            >
              {initials}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-navy">{usuario?.nombre || details.label}</p>
              <p className="text-xs text-slate-500">{details.title}</p>
            </div>
          </div>
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default RoleTopbar;
