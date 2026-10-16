import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  GraduationCap,
  Megaphone,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMisClases, getTareasProfesor } from "../../api/api";

const InicioProfesor = () => {
  const { usuario } = useAuth();
  const [clases, setClases] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const fechaHoy = useMemo(
    () => new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()),
    [],
  );
  const diaHoy = useMemo(
    () => new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date()).toLocaleLowerCase("es-AR"),
    [],
  );

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      const [classesResult, tasksResult] = await Promise.allSettled([
        getMisClases(),
        getTareasProfesor(),
      ]);
      if (!active) return;

      if (classesResult.status === "fulfilled") {
        const response = classesResult.value.data;
        setClases(Array.isArray(response) ? response : response.clases || []);
      } else {
        console.error("Error al cargar las clases del profesor:", classesResult.reason);
      }
      if (tasksResult.status === "fulfilled" && Array.isArray(tasksResult.value.data)) {
        setTareas(tasksResult.value.data);
      } else if (tasksResult.status === "rejected") {
        console.error("Error al cargar las tareas del profesor:", tasksResult.reason);
      }
      setLoadError(classesResult.status === "rejected" || tasksResult.status === "rejected");
      setLoading(false);
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const clasesHoy = clases
    .filter((clase) => clase.diaSemana?.toLocaleLowerCase("es-AR") === diaHoy)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const materiasUnicas = new Set(clases.map((clase) => clase.materia?._id).filter(Boolean)).size;
  const metricas = [
    { label: "Clases de hoy", value: clasesHoy.length, icon: CalendarDays, color: "bg-blue-600" },
    { label: "Clases asignadas", value: clases.length, icon: BookOpen, color: "bg-indigo-600" },
    { label: "Materias", value: materiasUnicas, icon: GraduationCap, color: "bg-violet-600" },
    { label: "Tareas publicadas", value: tareas.length, icon: ClipboardCheck, color: "bg-emerald-600" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-800 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-8 -top-16 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-100">
              <GraduationCap size={14} /> Portal docente
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ¡Buen día{usuario?.nombre ? `, ${usuario.nombre.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-2 text-sm capitalize text-indigo-100 sm:text-base">{fechaHoy}</p>
          </div>
          <Link to="/profesor/tomar-asistencia" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-50 sm:self-auto">
            <CalendarCheck2 size={17} /> Tomar asistencia
          </Link>
        </div>
      </header>

      {loadError && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No se pudo actualizar alguna sección. Revisa tu conexión e inténtalo nuevamente.
        </div>
      )}

      <section aria-label="Resumen docente" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {metricas.map(({ label, value, icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-slate-100" /> : value}
                </p>
              </div>
              <span className={`rounded-xl p-2.5 text-white sm:p-3 ${color}`}>{createElement(icon, { size: 19 })}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(290px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Agenda real</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Tus clases de hoy</h2>
            </div>
            <Link to="/profesor/Clases" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Ver horario</Link>
          </div>
          {loading ? (
            <div className="space-y-3" aria-label="Cargando clases">
              {[0, 1].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />)}
            </div>
          ) : clasesHoy.length ? (
            <ul className="space-y-3">
              {clasesHoy.map((clase) => (
                <li key={clase._id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">{clase.materia?.nombre || "Clase asignada"}</h3>
                    <p className="mt-1 text-sm text-slate-500">{clase.anio}° {clase.division}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                    <Clock3 size={15} className="text-indigo-500" />{clase.horaInicio}–{clase.horaFin}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-9 text-center">
              <CalendarDays size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No tienes clases asignadas para hoy</p>
              <p className="mt-1 text-sm text-slate-500">Consulta el horario semanal para planificar tus próximas clases.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Herramientas</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Accesos docentes</h2>
          <div className="mt-4 space-y-3">
            <QuickLink to="/profesor/Clases" icon={Users} label="Mis clases" detail="Cursos y alumnos asignados" />
            <QuickLink to="/profesor/cargar-notas" icon={GraduationCap} label="Cargar notas" detail="Actualizar el seguimiento académico" />
            <QuickLink to="/profesor/cargar-tarea" icon={FilePlus2} label="Crear tarea" detail="Publicar una actividad nueva" />
            <QuickLink to="/profesor/crud-anuncios" icon={Megaphone} label="Anuncios" detail="Compartir novedades con tus cursos" />
          </div>
        </section>
      </div>
    </div>
  );
};

const QuickLink = ({ to, icon, label, detail }) => (
  <Link to={to} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/50">
    <span className="rounded-xl bg-slate-50 p-2.5 text-slate-500 transition group-hover:bg-white group-hover:text-indigo-700">{createElement(icon, { size: 19 })}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-slate-800">{label}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
    </span>
    <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-700" />
  </Link>
);

export default InicioProfesor;
