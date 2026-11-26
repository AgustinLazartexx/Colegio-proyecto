import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMisClases, getTareasProfesor } from "../../api/api";

const formatShortDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? "—"
    : parsed.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
};

const InicioProfesor = () => {
  const { usuario } = useAuth();
  const [clases, setClases] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fechaHoy = useMemo(
    () =>
      new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
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

  const clasesHoy = useMemo(
    () =>
      clases
        .filter((clase) => clase.diaSemana?.toLocaleLowerCase("es-AR") === diaHoy)
        .sort((a, b) => String(a.horaInicio || "").localeCompare(String(b.horaInicio || ""))),
    [clases, diaHoy],
  );

  const clasePorMateria = useMemo(() => {
    const map = new Map();
    clases.forEach((clase) => {
      const matId = clase.materia?._id;
      if (matId && !map.has(matId)) map.set(matId, clase._id || clase.id);
    });
    return map;
  }, [clases]);

  const primeraClaseId = clasesHoy[0]?._id || clasesHoy[0]?.id || clases[0]?._id || clases[0]?.id;
  const materiasUnicas = new Set(clases.map((clase) => clase.materia?._id).filter(Boolean)).size;
  const tareasRecientes = tareas.slice(0, 4);

  const metricas = [
    { label: "Clases de hoy", value: clasesHoy.length, icon: CalendarDays, color: "bg-secondary" },
    { label: "Clases asignadas", value: clases.length, icon: BookOpen, color: "bg-blue-700" },
    { label: "Materias", value: materiasUnicas, icon: GraduationCap, color: "bg-blue-600" },
    { label: "Tareas publicadas", value: tareas.length, icon: ClipboardCheck, color: "bg-emerald-600" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-8 -top-16 h-56 w-56 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100">
              <GraduationCap size={14} /> Portal docente
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ¡Buen día{usuario?.nombre ? `, ${usuario.nombre.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-2 text-sm capitalize text-blue-100 sm:text-base">{fechaHoy}</p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <Link
              to={primeraClaseId ? `/profesor/Clases/${primeraClaseId}?tab=asistencia` : "/profesor/Clases"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-blue-50"
            >
              <CalendarCheck2 size={17} />
              {clasesHoy.length ? "Tomar asistencia hoy" : "Ir a mis clases"}
            </Link>
            {primeraClaseId && (
              <Link
                to={`/profesor/Clases/${primeraClaseId}?tab=notas`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <GraduationCap size={17} /> Cargar notas
              </Link>
            )}
          </div>
        </div>
      </header>

      {loadError && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No se pudo actualizar alguna sección. Revisá tu conexión e inténtalo nuevamente.
        </div>
      )}

      <section aria-label="Resumen docente" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {metricas.map(({ label, value, icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-slate-100" /> : value}
                </p>
              </div>
              <span className={`rounded-xl p-2.5 text-white sm:p-3 ${color}`}>
                {createElement(icon, { size: 19 })}
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.85fr)]">
        {/* Clases de hoy con accesos de 1 clic */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Agenda real</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Tus clases de hoy</h2>
            </div>
            <Link to="/profesor/Clases" className="text-sm font-semibold text-secondary hover:text-blue-900">
              Ver todas
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3" aria-label="Cargando clases">
              {[0, 1].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />
              ))}
            </div>
          ) : clasesHoy.length ? (
            <ul className="space-y-3">
              {clasesHoy.map((clase) => {
                const id = clase._id || clase.id;
                return (
                  <li
                    key={id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                      <BookOpen size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profesor/Clases/${id}`}
                        className="font-semibold text-slate-900 hover:text-secondary"
                      >
                        {clase.materia?.nombre || "Clase asignada"}
                      </Link>
                      <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>{clase.anio}° &quot;{clase.division}&quot;</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                          <Clock3 size={13} className="text-secondary" />
                          {clase.horaInicio}–{clase.horaFin}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        to={`/profesor/Clases/${id}?tab=asistencia`}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-blue-100"
                      >
                        Asistencia
                      </Link>
                      <Link
                        to={`/profesor/Clases/${id}?tab=notas`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-canvas"
                      >
                        Notas
                      </Link>
                      <Link
                        to={`/profesor/Clases/${id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800"
                      >
                        Abrir <ArrowRight size={13} />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-9 text-center">
              <CalendarDays size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No tenés clases asignadas para hoy</p>
              <p className="mt-1 text-sm text-slate-500">
                Consultá tus materias para cargar tareas, notas o anuncios en cualquier curso.
              </p>
              <Link
                to="/profesor/Clases"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                Ir a mis clases <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>

        {/* Tareas recientes para corregir entregas en 1 clic + accesos */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Seguimiento</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Corregir entregas</h2>
              </div>
              <FileText size={19} className="text-secondary" aria-hidden="true" />
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[0, 1].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-50" />
                ))}
              </div>
            ) : tareasRecientes.length ? (
              <ul className="space-y-2.5">
                {tareasRecientes.map((tarea) => {
                  const targetClaseId = clasePorMateria.get(tarea.materia?._id);
                  const to = targetClaseId
                    ? `/profesor/Clases/${targetClaseId}?tab=tareas&tareaId=${tarea._id}`
                    : "/profesor/Clases";
                  return (
                    <li key={tarea._id}>
                      <Link
                        to={to}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-secondary">
                            {tarea.titulo}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {tarea.materia?.nombre || "Materia"} · Vence {formatShortDate(tarea.fechaEntrega)}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-secondary">
                          <CheckCircle2 size={14} /> Revisar
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                No publicaste tareas todavía. Podés crear una desde cualquier materia.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary">Atajos</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Accesos directos</h2>
            <div className="mt-4 space-y-2.5">
              <QuickLink
                to="/profesor/Clases"
                icon={BookOpen}
                label="Espacio por materia"
                detail="Alumnos, asistencia, tareas, notas y anuncios"
              />
              <QuickLink
                to={primeraClaseId ? `/profesor/Clases/${primeraClaseId}?tab=anuncios` : "/profesor/crud-anuncios"}
                icon={Megaphone}
                label="Publicar anuncio"
                detail="Avisos rápidos para tus cursos"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const QuickLink = ({ to, icon, label, detail }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"
  >
    <span className="rounded-xl bg-slate-50 p-2.5 text-slate-500 transition group-hover:bg-white group-hover:text-secondary">
      {createElement(icon, { size: 18 })}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-slate-800">{label}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
    </span>
    <ArrowRight
      size={16}
      className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-secondary"
    />
  </Link>
);

export default InicioProfesor;
