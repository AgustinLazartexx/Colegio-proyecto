import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api, { getAnunciosAlumno, getMisAsistenciasAlumno, getMisClasesAlumno, getMisNotasAlumno } from "../../api/api";

const dayToday = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date());

const InicioAlumno = () => {
  const { usuario } = useAuth();
  const [clases, setClases] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [asistencia, setAsistencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const fechaHoy = useMemo(
    () => new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
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
      const enrolledClasses = classesResult.status === "fulfilled" && Array.isArray(classesResult.value.data)
        ? classesResult.value.data
        : [];
      if (classesResult.status === "fulfilled") setClases(enrolledClasses);
      else console.error("Error al cargar clases del alumno:", classesResult.reason);

      if (announcementsResult.status === "fulfilled" && Array.isArray(announcementsResult.value.data)) {
        setAnuncios(announcementsResult.value.data.slice(0, 3));
      } else {
        if (announcementsResult.status === "rejected") console.error("Error al cargar anuncios del alumno:", announcementsResult.reason);
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
      const materias = [...new Map(enrolledClasses
        .filter((clase) => clase.materia?._id)
        .map((clase) => [clase.materia._id, clase.materia])).values()];
      const taskResults = await Promise.allSettled(
        materias.map((materia) => api.get(`/tareas/alumno/materia/${materia._id}`)),
      );
      if (!active) return;
      setTareas(taskResults.flatMap((result) => {
        if (result.status === "fulfilled" && Array.isArray(result.value.data)) return result.value.data;
        if (result.status === "rejected") console.error("Error al cargar tareas del alumno:", result.reason);
        return [];
      }));
      if (taskResults.some((result) => result.status === "rejected")) setLoadError(true);
      setLoading(false);
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const clasesHoy = clases.filter((clase) =>
    clase.diaSemana?.toLocaleLowerCase("es-AR") === dayToday.toLocaleLowerCase("es-AR"),
  );
  const notasFinales = notas
    .map((nota) => Number(nota.notaFinalTrimestre))
    .filter(Number.isFinite);
  const promedio = notasFinales.length
    ? (notasFinales.reduce((total, nota) => total + nota, 0) / notasFinales.length).toFixed(1)
    : "—";

  const metrics = [
    { label: "Materias", value: new Set(clases.map((clase) => clase.materia?._id).filter(Boolean)).size, icon: BookOpen, color: "bg-blue-600" },
    { label: "Tareas", value: tareas.length, icon: ClipboardList, color: "bg-amber-500" },
    { label: "Promedio", value: promedio, icon: Award, color: "bg-violet-600" },
    { label: "Asistencia", value: asistencia ? `${asistencia.porcentaje}%` : "—", icon: CheckCircle2, color: "bg-emerald-600" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Tu espacio académico</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ¡Hola{usuario?.nombre ? `, ${usuario.nombre.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-2 text-sm capitalize text-blue-100 sm:text-base">{fechaHoy}</p>
          </div>
          <Link to="/alumno/materias" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50 sm:self-auto">
            Ver mis materias <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {loadError && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Algunas secciones no pudieron actualizarse. Los datos disponibles siguen visibles.
        </div>
      )}

      <section aria-label="Resumen académico" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {metrics.map(({ label, value, icon, color }) => (
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
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Organiza tu jornada</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Clases de hoy</h2>
            </div>
            <Link to="/alumno/materias" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Ver materias</Link>
          </div>
          {loading ? (
            <div className="space-y-3" aria-label="Cargando horario">
              {[0, 1].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />)}
            </div>
          ) : clasesHoy.length ? (
            <ul className="space-y-3">
              {clasesHoy.map((clase) => (
                <li key={clase._id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpen size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">{clase.materia?.nombre || "Clase"}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Clock3 size={13} />{clase.horaInicio}–{clase.horaFin}</span>
                      {clase.aula && <span className="inline-flex items-center gap-1"><MapPin size={13} />{clase.aula}</span>}
                    </div>
                  </div>
                  <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:self-auto">
                    {clase.anio}° {clase.division}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-9 text-center">
              <CalendarDays size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No tienes clases asignadas para hoy</p>
              <p className="mt-1 text-sm text-slate-500">Puedes consultar tu cronograma desde materias.</p>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Comunicados</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Últimos anuncios</h2>
              </div>
              <Bell size={20} className="text-violet-600" />
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
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No hay anuncios nuevos.</p>
            )}
            <Link to="/alumno/anuncios" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
              Ver todos <ArrowRight size={15} />
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Accesos rápidos</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <QuickLink to="/alumno/tareas" icon={createElement(FileText, { size: 19 })} label="Mis tareas" />
              <QuickLink to="/alumno/boletin" icon={createElement(Award, { size: 19 })} label="Mi boletín" />
              <QuickLink to="/alumno/asistencias" icon={createElement(CheckCircle2, { size: 19 })} label="Asistencias" />
              <QuickLink to="/alumno/inscripcion" icon={createElement(BookOpen, { size: 19 })} label="Mis clases" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const QuickLink = ({ to, icon, label }) => (
  <Link to={to} className="group flex min-h-20 flex-col justify-between rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/50">
    <span className="text-slate-400 transition group-hover:text-blue-700">{icon}</span>
    <span className="mt-3 text-sm font-semibold text-slate-700 group-hover:text-blue-800">{label}</span>
  </Link>
);

export default InicioAlumno;
