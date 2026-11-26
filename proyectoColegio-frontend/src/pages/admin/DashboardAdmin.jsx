import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileClock,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAdminStats, getAuditoriaNotas } from "../../api/api";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";

const timelineSteps = ["Inicio", "Trimestre 1", "Trimestre 2", "Trimestre 3", "Recuperación", "Cierre"];

const quickActions = [
  { to: "/admin/clasesAdminAlumnos", label: "Inscribir alumno", icon: UserPlus, color: "bg-blue-50 text-blue-700" },
  { to: "/admin/AsistenciaGestion", label: "Tomar asistencia", icon: CalendarCheck, color: "bg-emerald-50 text-emerald-700" },
  { to: "/admin/cuotas?estado=pendiente", label: "Registrar pago", icon: Wallet, color: "bg-amber-50 text-amber-700" },
  { to: "/admin/GestionNotas", label: "Cargar notas", icon: BookOpenCheck, color: "bg-violet-50 text-violet-700" },
];

const dateOnlyTimestamp = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const argentinaTodayTimestamp = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
};

const getTimeline = (cycle) => {
  if (!cycle) return { progress: 0, currentStep: 0 };
  if (cycle.estado === "CERRADO") return { progress: 100, currentStep: 5 };
  if (cycle.estado === "RECUPERACION") return { progress: 88, currentStep: 4 };
  if (cycle.estado === "PLANIFICADO") return { progress: 0, currentStep: 0 };

  const start = dateOnlyTimestamp(cycle.fechaInicio);
  const end = dateOnlyTimestamp(cycle.fechaCierre);
  if (!start || !end || end <= start) return { progress: 0, currentStep: 0 };

  const today = argentinaTodayTimestamp();
  const progress = Math.max(0, Math.min(100, Math.round(((today - start) / (end - start)) * 100)));
  const currentStep = progress < 20 ? 0 : progress < 40 ? 1 : progress < 60 ? 2 : 3;
  return { progress, currentStep };
};

const actionForCycle = (cycle, currentStep) => {
  if (!cycle) return { label: "Crear ciclo lectivo", to: "/admin/ciclos" };
  if (cycle.estado === "PLANIFICADO") return { label: "Preparar ciclo", to: "/admin/ciclos" };
  if (cycle.estado === "RECUPERACION") return { label: "Gestionar recuperaciones", to: "/admin/GestionNotas" };
  if (cycle.estado === "CERRADO") return { label: "Revisar ciclos", to: "/admin/ciclos" };
  return currentStep === 0
    ? { label: "Tomar asistencia", to: "/admin/AsistenciaGestion" }
    : { label: "Revisar notas", to: "/admin/GestionNotas" };
};

const DashboardAdmin = () => {
  const { usuario } = useAuth();
  const { cycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [activityError, setActivityError] = useState("");
  const today = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    if (loadingCycles) return undefined;
    let active = true;
    const loadDashboard = async () => {
      setLoading(true);
      setStatsError("");
      setActivityError("");
      const [statsResult, auditResult] = await Promise.allSettled([
        cycleId ? getAdminStats(cycleId) : Promise.resolve({ data: null }),
        cycleId ? getAuditoriaNotas(cycleId) : Promise.resolve({ data: [] }),
      ]);

      if (!active) return;
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.data);
      } else {
        console.error("Error al cargar estadísticas del panel:", statsResult.reason);
        setStatsError(statsResult.reason.response?.data?.msg || "No se pudieron cargar las métricas del ciclo.");
      }
      if (auditResult.status === "fulfilled") {
        setActivity(Array.isArray(auditResult.value.data) ? auditResult.value.data.slice(0, 4) : []);
      } else {
        console.error("Error al cargar la auditoría del panel:", auditResult.reason);
        setActivityError("No se pudo cargar la actividad reciente.");
      }
      setLoading(false);
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [cycleId, loadingCycles]);

  const { progress, currentStep } = getTimeline(selectedCycle);
  const cycleAction = actionForCycle(selectedCycle, currentStep);
  const metrics = [
    {
      label: "Alumnos activos",
      value: stats?.alumnosActivos,
      detail: "Alumnos inscriptos en este ciclo",
      icon: Users,
      color: "bg-blue-600",
      to: cycleId ? "/admin/usuarios?rol=alumno&todos=1&isActive=true" : null,
    },
    {
      label: "Clases del ciclo",
      value: stats?.clasesCiclo,
      detail: "Estructura académica seleccionada",
      icon: CalendarDays,
      color: "bg-violet-600",
      to: "/admin/CrearClases",
    },
    {
      label: "Cuotas vencidas",
      value: stats?.cuotasVencidas,
      detail: `${stats?.cuotasPendientes ?? "—"} pendientes`,
      icon: CircleDollarSign,
      color: "bg-amber-600",
      to: "/admin/cuotas?estado=vencido",
    },
    {
      label: "Alumnos en riesgo",
      value: stats?.alumnosEnRiesgo,
      detail: "Materias con promedio menor a 6",
      icon: AlertTriangle,
      color: "bg-rose-600",
      to: "/admin/riesgo-academico",
    },
  ];

  const alerts = useMemo(() => {
    if (!selectedCycle) return [];
    const items = [];
    if (selectedCycle.estado === "PLANIFICADO") {
      items.push({
        title: `${selectedCycle.nombre} está planificado`,
        detail: "Revisa las clases y activa el ciclo cuando corresponda.",
        to: "/admin/ciclos",
        action: "Abrir ciclos",
        icon: CalendarDays,
        color: "text-blue-700 bg-blue-50",
      });
    }
    if (stats?.cursosSinAsistencia > 0) {
      const courses = stats.cursosSinAsistenciaDetalle
        .slice(0, 3)
        .map((course) => `${course.anio}° ${course.division}`)
        .join(", ");
      items.push({
        title: `${stats.cursosSinAsistencia} cursos sin asistencia de hoy`,
        detail: courses || "Hay cursos activos pendientes de registro.",
        to: "/admin/AsistenciaGestion",
        action: "Tomar asistencia",
        icon: CalendarCheck,
        color: "text-emerald-700 bg-emerald-50",
      });
    }
    if (stats?.alumnosEnRiesgo > 0) {
      items.push({
        title: `${stats.alumnosEnRiesgo} alumnos con materias en riesgo`,
        detail: "Revisa sus puntajes trimestrales y el seguimiento de recuperación.",
        to: "/admin/riesgo-academico",
        action: "Ver alumnos",
        icon: AlertTriangle,
        color: "text-rose-700 bg-rose-50",
      });
    }
    if (stats?.cuotasVencidas > 0) {
      items.push({
        title: `${stats.cuotasVencidas} cuotas vencidas`,
        detail: "Consulta los alumnos con pagos vencidos del ciclo.",
        to: "/admin/cuotas?estado=vencido",
        action: "Ver morosos",
        icon: Wallet,
        color: "text-amber-700 bg-amber-50",
      });
    }
    if (stats?.cuotasPendientes > 0) {
      items.push({
        title: `${stats.cuotasPendientes} cuotas pendientes de pago`,
        detail: "Consulta los pagos pendientes del ciclo seleccionado.",
        to: "/admin/cuotas?estado=pendiente",
        action: "Ver pendientes",
        icon: Wallet,
        color: "text-amber-700 bg-amber-50",
      });
    }
    if (stats && items.length === 0) {
      items.push({
        title: "Sin pendientes operativos urgentes",
        detail: "No se detectaron cuotas pendientes, cursos sin asistencia ni alumnos en riesgo.",
        to: "/admin",
        action: "Ver resumen",
        icon: CheckCircle2,
        color: "text-emerald-700 bg-emerald-50",
      });
    }
    return items;
  }, [selectedCycle, stats]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
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
              {selectedCycle ? `Panel de gestión para ${selectedCycle.nombre}.` : "Tu centro de control para la actividad del colegio."}
            </p>
          </div>
          <p className="capitalize text-sm text-blue-100">{today}</p>
        </div>
      </header>

      <section aria-labelledby="timeline-title" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Ciclo lectivo</p>
            <h2 id="timeline-title" className="mt-1 text-xl font-bold text-navy">
              {selectedCycle?.nombre || (loadingCycles ? "Cargando ciclo..." : "Sin ciclo seleccionado")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedCycle
                ? `${new Date(`${String(selectedCycle.fechaInicio).slice(0, 10)}T00:00:00`).toLocaleDateString("es-AR")} — ${new Date(`${String(selectedCycle.fechaCierre).slice(0, 10)}T00:00:00`).toLocaleDateString("es-AR")} · ${selectedCycle.estado}`
                : "Crea o selecciona un ciclo lectivo desde la barra superior."}
            </p>
          </div>
          <Link to={cycleAction.to} className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
            {cycleAction.label} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="relative min-w-[690px] px-3 pt-1">
            <div className="absolute left-[8.33%] right-[8.33%] top-[13px] h-1 rounded-full bg-slate-100" />
            <div
              className="absolute left-[8.33%] top-[13px] h-1 rounded-full bg-secondary transition-[width] duration-500"
              style={{ width: `${(Math.min(100, Math.max(0, progress)) * 0.8334).toFixed(2)}%` }}
            />
            <ol className="relative grid grid-cols-6">
              {timelineSteps.map((step, index) => {
                const complete = index < currentStep;
                const current = index === currentStep;
                return (
                  <li key={step} className="flex flex-col items-center text-center">
                    <span className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      complete ? "border-secondary bg-secondary text-white" :
                        current ? "border-secondary bg-white ring-4 ring-blue-100" : "border-slate-200 bg-white"
                    }`}>
                      {complete ? <CheckCircle2 size={14} /> : <span className={`h-2 w-2 rounded-full ${current ? "bg-secondary" : "bg-slate-200"}`} />}
                    </span>
                    <span className={`mt-3 text-xs font-semibold ${current ? "text-secondary" : complete ? "text-slate-700" : "text-slate-400"}`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Avance estimado: {progress}%</span>
          <span>Los hitos trimestrales son orientativos; el ciclo no registra fechas trimestrales.</span>
        </div>
      </section>

      {statsError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{statsError}</div>}

      <section aria-label="Indicadores del ciclo lectivo" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon, color, to }) => (
          <Link
            key={label}
            to={to || "/admin/ciclos"}
            aria-disabled={!cycleId}
            className={`group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${!cycleId ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" /> : value ?? "—"}
                </p>
              </div>
              <span className={`rounded-xl p-3 text-white ${color}`}>{createElement(icon, { size: 21 })}</span>
            </div>
            <p className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>{detail}</span>
              <ArrowRight size={15} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-secondary" />
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Acciones rápidas</p>
          <h2 className="mt-1 text-xl font-bold text-navy">Tareas frecuentes</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ to, label, icon, color }) => (
            <Link key={label} to={to} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
              <span className={`rounded-xl p-3 ${color}`}>{createElement(icon, { size: 20 })}</span>
              <span className="flex-1 font-semibold text-slate-800">{label}</span>
              <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-secondary" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-700">Seguimiento</p>
            <h2 className="mt-1 text-xl font-bold text-navy">Alertas operativas</h2>
          </div>
          {loading || loadingCycles ? (
            <div className="space-y-3" aria-label="Cargando alertas">
              {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-50" />)}
            </div>
          ) : statsError ? (
            <p className="rounded-xl bg-red-50 px-4 py-5 text-sm text-red-800">No se muestran alertas hasta poder consultar las métricas del ciclo.</p>
          ) : !selectedCycle ? (
            <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">Selecciona o crea un ciclo lectivo para ver sus pendientes.</p>
          ) : alerts.length ? (
            <ul className="space-y-3">
              {alerts.map((alert) => (
                <li key={alert.title} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${alert.color}`}>
                    {createElement(alert.icon, { size: 19 })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">{alert.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{alert.detail}</p>
                  </div>
                  <Link to={alert.to} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-secondary hover:text-blue-900">
                    {alert.action} <ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">No hay alertas operativas para este ciclo.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Trazabilidad</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Cambios recientes</h2>
            </div>
            <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><FileClock size={19} /></span>
          </div>
          {loading ? (
            <div className="space-y-3" aria-label="Cargando actividad">
              {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-50" />)}
            </div>
          ) : activityError ? (
            <p role="status" className="rounded-xl bg-amber-50 px-4 py-5 text-sm text-amber-900">{activityError}</p>
          ) : activity.length ? (
            <ul className="divide-y divide-slate-100">
              {activity.map((item) => (
                <li key={item._id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-800">{item.campoModificado} actualizado en {item.materia?.nombre || "una materia"}</p>
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
