import { createElement } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  CalendarRange,
  FileEdit,
  GraduationCap,
  House,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navSections = [
  {
    title: "General",
    items: [{ to: "/admin", icon: House, text: "Inicio", end: true, key: "dashboard" }],
  },
  {
    title: "Estructura Académica",
    items: [
      { to: "/admin/ciclos", icon: CalendarRange, text: "Ciclos Lectivos" },
      { to: "/admin/materias", icon: BookOpen, text: "Materias" },
      { to: "/admin/CrearClases", icon: GraduationCap, text: "Clases", key: "classes" },
    ],
  },
  {
    title: "Comunidad",
    items: [{ to: "/admin/usuarios", icon: Users, text: "Usuarios", key: "users" }],
  },
  {
    title: "Seguimiento Académico",
    items: [
      { to: "/admin/AsistenciaGestion", icon: CalendarCheck, text: "Asistencias", key: "attendance" },
      { to: "/admin/GestionNotas", icon: FileEdit, text: "Notas", key: "grades" },
      { to: "/admin/riesgo-academico", icon: AlertTriangle, text: "Alumnos en Riesgo" },
    ],
  },
  {
    title: "Finanzas",
    items: [{ to: "/admin/cuotas", icon: Wallet, text: "Cuotas", key: "fees" }],
  },
];

const SidebarAdmin = ({
  isOpen = false,
  collapsed = false,
  onToggleCollapsed = () => {},
  onNavigate = () => {},
}) => {
  const { pathname, search } = useLocation();
  const isQuotaEntry =
    pathname === "/admin/cuotas" ||
    (pathname === "/admin/usuarios" && search.includes("panel=cuotas"));
  const isDashboardRoute = ["/admin", "/admin/Inicio"].includes(pathname);
  const isClassesRoute =
    pathname.startsWith("/admin/CrearClases") ||
    pathname.startsWith("/admin/clases") ||
    pathname.startsWith("/admin/clasesAdminAlumnos");
  const isAttendanceRoute =
    pathname.startsWith("/admin/AsistenciaGestion") ||
    pathname.startsWith("/admin/VerAsistencias") ||
    pathname.startsWith("/admin/asistencias");
  const isGradesRoute =
    pathname.startsWith("/admin/GestionNotas") || pathname.startsWith("/admin/AuditoriaNotas");

  const isItemActive = (item, isActive) => {
    if (item.key === "dashboard") return isDashboardRoute;
    if (item.key === "classes") return isClassesRoute;
    if (item.key === "attendance") return isAttendanceRoute;
    if (item.key === "grades") return isGradesRoute;
    if (item.key === "fees") return isQuotaEntry;
    if (item.key === "users") return isActive && !isQuotaEntry;
    return isActive;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white text-navy shadow-xl shadow-slate-900/10 transition-all duration-300 md:sticky md:top-0 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "md:w-20" : "md:w-72"}`}
    >
      <div
        className={`flex min-h-[3.75rem] items-center justify-between border-b border-slate-100 px-4 ${
          collapsed ? "md:justify-center md:px-2" : ""
        }`}
      >
        <div className={`flex min-w-0 items-center gap-3 ${collapsed ? "md:justify-center" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary ring-1 ring-blue-100">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div className={collapsed ? "md:hidden" : ""}>
            <p className="text-sm font-extrabold tracking-tight text-navy">Colegio Reina</p>
            <p className="text-[11px] font-medium text-slate-500">Administración</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          aria-pressed={collapsed}
          title={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 md:flex"
        >
          {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      </div>

      <nav aria-label="Navegación de administración" className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navSections.map((section, sectionIndex) => (
          <section
            key={section.title}
            aria-label={section.title}
            className={sectionIndex > 0 ? "border-t border-slate-100 pt-4" : ""}
          >
            <h2
              className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${
                collapsed ? "md:sr-only" : ""
              }`}
            >
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  title={collapsed ? item.text : undefined}
                  aria-label={item.text}
                  className={({ isActive }) => {
                    const active = isItemActive(item, isActive);
                    return `group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                      collapsed ? "md:justify-center md:px-2" : ""
                    } ${
                      active
                        ? "bg-blue-50 text-secondary ring-1 ring-inset ring-blue-100"
                        : "text-slate-600 hover:bg-canvas hover:text-navy"
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const active = isItemActive(item, isActive);
                    return (
                      <>
                        {active && (
                          <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-secondary" />
                        )}
                        {createElement(item.icon, {
                          size: 18,
                          "aria-hidden": true,
                          className: "shrink-0",
                        })}
                        <span className={collapsed ? "md:hidden" : ""}>{item.text}</span>
                      </>
                    );
                  }}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className={`border-t border-slate-100 p-4 ${collapsed ? "md:px-2" : ""}`}>
        <div className={`flex items-center gap-2 rounded-xl bg-warm px-3 py-2.5 ${collapsed ? "md:justify-center md:px-2" : ""}`}>
          <Layers size={16} className="shrink-0 text-accent" aria-hidden="true" />
          <span className={`text-xs font-medium text-slate-500 ${collapsed ? "md:hidden" : ""}`}>Gestión escolar</span>
        </div>
      </div>
    </aside>
  );
};

export default SidebarAdmin;
