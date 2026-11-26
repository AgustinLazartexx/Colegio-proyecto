import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  MapPin,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api, {
  BACKEND_URL,
  getAnunciosAlumno,
  getMisAsistenciasAlumno,
  getMisClasesAlumno,
  getMisNotasAlumno,
} from "../../api/api";
import EntregarTarea from "../../components/alumno/EntregarTarea";
import FilterChips from "../../components/admin/FilterChips";
import SlideOverDrawer from "../../components/admin/SlideOverDrawer";

const dayToday = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date());

const parseDateOnly = (value) => {
  if (!value) return null;
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
};

const getDayDiff = (date) => {
  if (!date) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target - startToday) / 86400000);
};

const formatDueLabel = (diff) => {
  if (diff === null) return { text: "Sin fecha", style: "bg-slate-100 text-slate-600" };
  if (diff < 0) return { text: `Vencida hace ${Math.abs(diff)}d`, style: "bg-red-50 text-red-700" };
  if (diff === 0) return { text: "Vence hoy", style: "bg-amber-100 text-amber-900" };
  if (diff === 1) return { text: "Vence mañana", style: "bg-amber-50 text-amber-800" };
  if (diff <= 7) return { text: `En ${diff} días`, style: "bg-blue-50 text-secondary" };
  return { text: `En ${diff} días`, style: "bg-canvas text-slate-600" };
};

const pendingViewOptions = [
  { value: "lista", label: "Lista" },
  { value: "calendario", label: "Por fecha" },
];

const InicioAlumno = () => {
  const { usuario } = useAuth();
  const [clases, setClases] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [asistencia, setAsistencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Estado del bloque "Pendientes próximos" y drawer directo de entrega
  const [pendingView, setPendingView] = useState("lista");
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [tareaParaEntregar, setTareaParaEntregar] = useState(null);

  const fechaHoy = useMemo(
    () =>
      new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        getMisClasesAlumno(),
        getAnunciosAlumno(),
        getMisNotasAlumno(),
        getMisAsistenciasAlumno(),
      ]);
      if (!active) return;

      const [classesResult, announcementsResult, gradesResult, attendanceResult] = results;
      const enrolledClasses =
        classesResult.status === "fulfilled" && Array.isArray(classesResult.value.data)
          ? classesResult.value.data
          : [];
      if (classesResult.status === "fulfilled") setClases(enrolledClasses);
      else console.error("Error al cargar clases del alumno:", classesResult.reason);

      if (announcementsResult.status === "fulfilled" && Array.isArray(announcementsResult.value.data)) {
        setAnuncios(announcementsResult.value.data.slice(0, 3));
      } else if (announcementsResult.status === "rejected") {
        console.error("Error al cargar anuncios del alumno:", announcementsResult.reason);
      }

      if (gradesResult.status === "fulfilled") {
        setNotas(gradesResult.value.data.notas || []);
      } else {
        console.error("Error al cargar notas del alumno:", gradesResult.reason);
      }

      if (attendanceResult.status === "fulfilled") {
        setAsistencia(attendanceResult.value.data.resumen || null);
      } else {
        console.error("Error al cargar asistencias del alumno:", attendanceResult.reason);
      }

      setLoadError(results.some((result) => result.status === "rejected"));

      const materias = [
        ...new Map(
          enrolledClasses
            .filter((clase) => clase.materia?._id)
            .map((clase) => [clase.materia._id, clase.materia]),
        ).values(),
      ];

      const taskResults = await Promise.allSettled(
        materias.map((materia) =>
          api.get(`/tareas/alumno/materia/${materia._id}`).then((res) => ({
            materia,
            items: Array.isArray(res.data) ? res.data : [],
          })),
        ),
      );
      if (!active) return;

      setTareas(
        taskResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return result.value.items.map((tarea) => ({
              ...tarea,
              materiaNombre: result.value.materia.nombre,
              materiaId: result.value.materia._id,
            }));
          }
          console.error("Error al cargar tareas del alumno:", result.reason);
          return [];
        }),
      );
      if (taskResults.some((result) => result.status === "rejected")) setLoadError(true);
      setLoading(false);
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const clasesHoy = useMemo(
    () =>
      clases.filter((clase) => {
        const dia = clase.diaSemana || clase.dia || "";
        return dia.toLocaleLowerCase("es-AR") === dayToday.toLocaleLowerCase("es-AR");
      }),
    [clases],
  );

  // Ordenar tareas: próximas a vencer primero, luego vencidas recientes
  const pendientesProximos = useMemo(() => {
    return [...tareas]
      .map((tarea) => {
        const dateObj = parseDateOnly(tarea.fechaEntrega);
        const diff = getDayDiff(dateObj);
        const dateKey = dateObj
          ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`
          : "sin-fecha";
        return { ...tarea, dateObj, diff, dateKey };
      })
      .sort((a, b) => {
        const aFuture = a.diff !== null && a.diff >= 0;
        const bFuture = b.diff !== null && b.diff >= 0;
        if (aFuture && !bFuture) return -1;
        if (!aFuture && bFuture) return 1;
        if (a.diff === null) return 1;
        if (b.diff === null) return -1;
        return aFuture ? a.diff - b.diff : b.diff - a.diff;
      });
  }, [tareas]);

  const calendarDates = useMemo(() => {
    const map = new Map();
    pendientesProximos.forEach((tarea) => {
      if (!tarea.dateObj) return;
      if (!map.has(tarea.dateKey)) {
        map.set(tarea.dateKey, {
          dateKey: tarea.dateKey,
          dateObj: tarea.dateObj,
          diff: tarea.diff,
          count: 0,
        });
      }
      map.get(tarea.dateKey).count += 1;
    });
    return [...map.values()].slice(0, 8);
  }, [pendientesProximos]);

  const tareasVisibles = useMemo(() => {
    if (pendingView === "calendario" && selectedDateKey) {
      return pendientesProximos.filter((tarea) => tarea.dateKey === selectedDateKey);
    }
    return pendientesProximos.slice(0, 5);
  }, [pendientesProximos, pendingView, selectedDateKey]);

  const proximasSieteDias = useMemo(
    () => pendientesProximos.filter((tarea) => tarea.diff !== null && tarea.diff >= 0 && tarea.diff <= 7).length,
    [pendientesProximos],
  );

  const notasFinales = notas
    .map((nota) => Number(nota.notaFinalTrimestre))
    .filter(Number.isFinite);
  const promedio = notasFinales.length
    ? (notasFinales.reduce((total, nota) => total + nota, 0) / notasFinales.length).toFixed(1)
    : "—";

  const metrics = [
    {
      label: "Materias",
      value: new Set(clases.map((clase) => clase.materia?._id).filter(Boolean)).size,
      icon: BookOpen,
      color: "bg-secondary",
      to: "/alumno/materias",
    },
    {
      label: "Tareas",
      value: tareas.length,
      icon: ClipboardList,
      color: "bg-amber-500",
      to: "/alumno/tareas",
    },
    {
      label: "Promedio",
      value: promedio,
      icon: Award,
      color: "bg-blue-700",
      to: "/alumno/boletin",
    },
    {
      label: "Asistencia",
      value: asistencia ? `${asistencia.porcentaje}%` : "—",
      icon: CheckCircle2,
      color: "bg-emerald-600",
      to: "/alumno/asistencias",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              Tu espacio académico
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ¡Hola{usuario?.nombre ? `, ${usuario.nombre.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-2 text-sm capitalize text-blue-100 sm:text-base">{fechaHoy}</p>
          </div>
          <div className="flex flex-wrap gap-2.5 self-start sm:self-auto">
            <Link
              to="/alumno/tareas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-blue-50"
            >
              <ClipboardList size={16} />
              Mis tareas {proximasSieteDias > 0 ? `(${proximasSieteDias} próximas)` : ""}
            </Link>
            <Link
              to="/alumno/materias"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Ver materias <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {loadError && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Algunas secciones no pudieron actualizarse. Los datos disponibles siguen visibles.
        </div>
      )}

      <section aria-label="Resumen académico" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {metrics.map(({ label, value, icon, color, to }) => (
          <Link
            key={label}
            to={to}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-5"
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
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(290px,0.85fr)]">
        <div className="space-y-6">
          {/* Bloque destacado accionable: Pendientes próximos (tareas + agenda por fecha) */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Agenda de entregas</p>
                <h2 className="mt-1 text-xl font-bold text-navy">Pendientes próximos</h2>
              </div>
              <div className="flex items-center gap-3">
                <FilterChips
                  label="Modo de pendientes"
                  options={pendingViewOptions}
                  value={pendingView}
                  onChange={(value) => {
                    setPendingView(value);
                    if (value === "lista") setSelectedDateKey("");
                  }}
                />
                <Link
                  to="/alumno/tareas"
                  className="text-sm font-semibold text-secondary hover:text-blue-900"
                >
                  Ver todas
                </Link>
              </div>
            </div>

            {pendingView === "calendario" && !loading && calendarDates.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-canvas p-3">
                <button
                  type="button"
                  onClick={() => setSelectedDateKey("")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    !selectedDateKey
                      ? "bg-secondary text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  Todas las fechas
                </button>
                {calendarDates.map((slot) => {
                  const active = selectedDateKey === slot.dateKey;
                  const shortDate = slot.dateObj.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                  });
                  return (
                    <button
                      key={slot.dateKey}
                      type="button"
                      onClick={() => setSelectedDateKey(active ? "" : slot.dateKey)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-secondary text-white shadow-sm"
                          : "bg-white text-navy ring-1 ring-slate-200 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <CalendarDays size={12} />
                      <span>{shortDate}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          active ? "bg-white/20 text-white" : "bg-blue-50 text-secondary"
                        }`}
                      >
                        {slot.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {loading ? (
              <div className="space-y-3" aria-label="Cargando pendientes">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />
                ))}
              </div>
            ) : tareasVisibles.length > 0 ? (
              <ul className="space-y-3">
                {tareasVisibles.map((tarea) => {
                  const badge = formatDueLabel(tarea.diff);
                  return (
                    <li
                      key={tarea._id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/20 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-secondary">
                            {tarea.materiaNombre || "Materia"}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.style}`}>
                            {badge.text}
                          </span>
                        </div>
                        <h3 className="mt-1.5 truncate font-semibold text-navy">{tarea.titulo}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Entrega:{" "}
                          {tarea.dateObj
                            ? tarea.dateObj.toLocaleDateString("es-AR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })
                            : "Sin fecha definida"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTareaParaEntregar(tarea)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800"
                        >
                          <Send size={13} />
                          Entregar
                        </button>
                        <Link
                          to={`/alumno/tareas?tareaId=${tarea._id}`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-canvas hover:text-navy"
                        >
                          Detalle
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-xl bg-canvas px-4 py-9 text-center">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
                <p className="mt-3 font-semibold text-navy">¡Estás al día con tus tareas!</p>
                <p className="mt-1 text-sm text-slate-500">
                  Cuando tus docentes publiquen trabajos aparecerán aquí ordenados por fecha de entrega.
                </p>
              </div>
            )}
          </section>

          {/* Clases de hoy */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Organiza tu jornada</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Clases de hoy</h2>
              </div>
              <Link to="/alumno/materias?vista=horario" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Ver horario semanal
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3" aria-label="Cargando horario">
                {[0, 1].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />
                ))}
              </div>
            ) : clasesHoy.length ? (
              <ul className="space-y-3">
                {clasesHoy.map((clase) => (
                  <li
                    key={clase._id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <BookOpen size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">{clase.materia?.nombre || "Clase"}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={13} />
                          {clase.horaInicio || clase.horarioInicio}–{clase.horaFin || clase.horarioFin}
                        </span>
                        {clase.aula && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={13} />
                            {clase.aula}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:self-auto">
                      {clase.anio}° {clase.division}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
                <CalendarDays size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">No tienes clases asignadas para hoy</p>
                <p className="mt-1 text-sm text-slate-500">
                  Puedes consultar tu horario semanal completo desde Materias.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary">Comunicados</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Últimos anuncios</h2>
              </div>
              <Bell size={20} className="text-secondary" />
            </div>
            {loading ? (
              <div className="h-24 animate-pulse rounded-xl bg-slate-50" />
            ) : anuncios.length ? (
              <ul className="divide-y divide-slate-100">
                {anuncios.map((anuncio) => (
                  <li key={anuncio._id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-semibold text-slate-800">{anuncio.titulo}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{anuncio.mensaje}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No hay anuncios nuevos.
              </p>
            )}
            <Link
              to="/alumno/anuncios"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Ver todos <ArrowRight size={15} />
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Accesos rápidos</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <QuickLink to="/alumno/tareas" icon={createElement(FileText, { size: 19 })} label="Mis tareas" />
              <QuickLink to="/alumno/boletin" icon={createElement(Award, { size: 19 })} label="Mi boletín" />
              <QuickLink to="/alumno/asistencias" icon={createElement(CheckCircle2, { size: 19 })} label="Asistencias" />
              <QuickLink
                to="/alumno/materias?vista=horario"
                icon={createElement(CalendarDays, { size: 19 })}
                label="Mi horario"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Drawer directo para entregar una tarea pendiente sin salir del inicio */}
      {tareaParaEntregar && (
        <SlideOverDrawer
          title={tareaParaEntregar.titulo}
          description={`${tareaParaEntregar.materiaNombre || "Materia"} · Entrega ${
            tareaParaEntregar.dateObj
              ? tareaParaEntregar.dateObj.toLocaleDateString("es-AR")
              : "sin fecha"
          }`}
          onClose={() => setTareaParaEntregar(null)}
          width="max-w-xl"
        >
          <div className="space-y-4 p-5 sm:p-7">
            {tareaParaEntregar.diff !== null && tareaParaEntregar.diff < 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
                <AlertCircle size={15} />
                Esta tarea superó la fecha de entrega estimada.
              </div>
            )}

            {tareaParaEntregar.descripcion && (
              <div className="rounded-2xl border border-slate-100 bg-canvas p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Consigna</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {tareaParaEntregar.descripcion}
                </p>
              </div>
            )}

            {tareaParaEntregar.archivo && (
              <a
                href={`${BACKEND_URL}/uploads/${tareaParaEntregar.archivo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-secondary transition hover:bg-blue-100"
              >
                <Download size={15} />
                Descargar material adjunto
              </a>
            )}

            <div>
              <h3 className="text-sm font-bold text-navy">Subir tu entrega</h3>
              <EntregarTarea
                tareaId={tareaParaEntregar._id}
                alumnoId={usuario?._id || usuario?.id}
              />
            </div>
          </div>
        </SlideOverDrawer>
      )}
    </div>
  );
};

const QuickLink = ({ to, icon, label }) => (
  <Link
    to={to}
    className="group flex min-h-20 flex-col justify-between rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
  >
    <span className="text-slate-400 transition group-hover:text-secondary">{icon}</span>
    <span className="mt-3 text-sm font-semibold text-slate-700 group-hover:text-navy">{label}</span>
  </Link>
);

export default InicioAlumno;
