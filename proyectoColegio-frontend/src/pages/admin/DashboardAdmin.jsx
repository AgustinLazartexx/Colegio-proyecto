import { createElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAdminStats, getAuditoriaNotas } from "../../api/api";

const quickLinks = [
  {
    to: "/admin/usuarios",
    label: "Usuarios",
    detail: "Crear cuentas y administrar accesos.",
    icon: Users,
    color: "bg-blue-50 text-blue-700",
  },
  {
    to: "/admin/materias",
    label: "Materias",
    detail: "Organizar el catálogo académico.",
    icon: BookOpen,
    color: "bg-violet-50 text-violet-700",
  },
  {
    to: "/admin/CrearClases",
    label: "Clases y horarios",
    detail: "Configurar cursos, aulas y docentes.",
    icon: CalendarDays,
    color: "bg-amber-50 text-amber-700",
  },
  {
    to: "/admin/clasesAdminAlumnos",
    label: "Inscripciones",
    detail: "Administrar alumnos por clase.",
    icon: Layers3,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    to: "/admin/GestionNotas",
    label: "Notas",
    detail: "Consultar y supervisar calificaciones.",
    icon: GraduationCap,
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    to: "/admin/AsistenciaGestion",
    label: "Asistencia",
    detail: "Registrar y revisar presentismo.",
    icon: ClipboardCheck,
    color: "bg-rose-50 text-rose-700",
  },
];

const DashboardAdmin = () => {
  const { usuario } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const today = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      const [statsResult, auditResult] = await Promise.allSettled([
        getAdminStats(),
        getAuditoriaNotas(),
      ]);

      if (!active) return;
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.data);
      } else {
        console.error("Error al cargar estadísticas del panel:", statsResult.reason);
        setLoadError(true);
      }
      if (auditResult.status === "fulfilled") {
        setActivity(Array.isArray(auditResult.value.data) ? auditResult.value.data.slice(0, 4) : []);
      } else {
        console.error("Error al cargar la auditoría del panel:", auditResult.reason);
        setLoadError(true);
      }
      setLoading(false);
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    { label: "Alumnos registrados", value: stats?.alumnos, icon: Users, color: "bg-blue-600" },
    { label: "Docentes", value: stats?.profesores, icon: GraduationCap, color: "bg-emerald-600" },
    { label: "Materias", value: stats?.materias, icon: BookOpen, color: "bg-violet-600" },
    { label: "Clases", value: stats?.clases, icon: CalendarDays, color: "bg-amber-600" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100">
              <ShieldCheck size={14} /> Administración escolar
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Hola{usuario?.nombre ? `, ${usuario.nombre.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
              Una vista clara de la actividad y las herramientas de gestión de tu colegio.
            </p>
          </div>
          <p className="capitalize text-sm text-blue-100">{today}</p>
        </div>
      </header>

      {loadError && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Algunas estadísticas o actividades no pudieron cargarse. Puedes seguir usando los accesos de gestión.
        </div>
      )}

      <section aria-label="Resumen del colegio" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" /> : value ?? "—"}
                </p>
              </div>
              <span className={`rounded-xl p-3 text-white ${color}`}>{createElement(icon, { size: 21 })}</span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">Datos registrados en el sistema</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Accesos directos</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Gestión del colegio</h2>
            </div>
            <span className="hidden text-sm text-slate-400 sm:inline">Elige una sección para empezar</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map(({ to, label, detail, icon, color }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-24 items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className={`shrink-0 rounded-xl p-3 ${color}`}>{createElement(icon, { size: 20 })}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-800">{label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{detail}</span>
                </span>
                <ArrowRight size={17} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Trazabilidad</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Cambios recientes</h2>
            </div>
            <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><FileClock size={19} /></span>
          </div>
          {loading ? (
            <div className="space-y-3" aria-label="Cargando actividad">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-50" />)}
            </div>
          ) : activity.length ? (
            <ul className="divide-y divide-slate-100">
              {activity.map((item) => (
                <li key={item._id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-800">
                    {item.campoModificado} actualizado en {item.materia?.nombre || "una materia"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.alumno?.nombre || "Alumno"} · {item.trimestre}° trimestre ·{" "}
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-AR") : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
              <FileClock size={26} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">Aún no hay cambios auditados</p>
              <p className="mt-1 text-xs text-slate-500">Las modificaciones administrativas aparecerán aquí.</p>
            </div>
          )}
          <Link to="/admin/AuditoriaNotas" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
            Abrir auditoría <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default DashboardAdmin;
