import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarCheck,
  Clock,
  FileText,
  GraduationCap,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMisClases, getTodasLasClases } from "../../api/api";
import FilterChips from "../../components/admin/FilterChips";
import Skeleton from "../../components/admin/Skeleton";

const DIAS_ORDEN = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Domingo: 7,
};

const esHoy = (dia) => new Date().getDay() === DIAS_ORDEN[dia];

const Clases = () => {
  const { usuario } = useAuth();
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState("todas"); // "todas" | "hoy"
  const [anioFiltro, setAnioFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    let active = true;
    const cargarClases = async () => {
      if (!usuario) return;
      setLoading(true);
      setError(null);
      try {
        const res = usuario.rol === "admin" ? await getTodasLasClases() : await getMisClases();
        const data = res.data?.clases || res.data || [];
        if (active) setClases(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando clases:", err);
        if (active) setError("No se pudieron cargar las clases.");
      } finally {
        if (active) setLoading(false);
      }
    };
    cargarClases();
    return () => {
      active = false;
    };
  }, [usuario]);

  const aniosDisponibles = useMemo(
    () =>
      [...new Set(clases.map((c) => String(c.nivel ?? c.anio)).filter(Boolean))].sort(),
    [clases],
  );

  const clasesHoyCount = useMemo(
    () => clases.filter((c) => esHoy(c.diaSemana)).length,
    [clases],
  );

  const clasesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return clases.filter((clase) => {
      if (vista === "hoy" && !esHoy(clase.diaSemana)) return false;
      if (anioFiltro && String(clase.nivel ?? clase.anio) !== anioFiltro) return false;
      if (q) {
        const texto = `${clase.materia?.nombre || ""} ${clase.anio || ""} ${clase.division || ""} ${clase.aula || ""}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [clases, vista, anioFiltro, busqueda]);

  const diasOrdenados = useMemo(() => {
    const agrupadas = clasesFiltradas.reduce((acc, clase) => {
      const dia = clase?.diaSemana || "Sin día";
      if (!acc[dia]) acc[dia] = [];
      acc[dia].push(clase);
      return acc;
    }, {});

    return Object.entries(agrupadas)
      .sort(([a], [b]) => (DIAS_ORDEN[a] || 99) - (DIAS_ORDEN[b] || 99))
      .map(([dia, lista]) => [
        dia,
        [...lista].sort((a, b) => String(a.horaInicio || "").localeCompare(String(b.horaInicio || ""))),
      ]);
  }, [clasesFiltradas]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <Skeleton className="h-28 w-full" rounded="rounded-3xl" />
        <Skeleton className="h-20 w-full" rounded="rounded-2xl" />
        <Skeleton className="h-56 w-full" rounded="rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-7">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <BookOpen size={14} aria-hidden="true" /> Espacio docente
          </p>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Mis clases y materias
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresá a cualquier materia para gestionar alumnos, asistencia, tareas, notas y anuncios en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="rounded-2xl bg-canvas px-4 py-3 text-center">
            <p className="text-xs font-semibold text-slate-500">Total</p>
            <p className="text-xl font-bold text-navy">{clases.length}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-secondary">Hoy</p>
            <p className="text-xl font-bold text-secondary">{clasesHoyCount}</p>
          </div>
        </div>
      </header>

      {clases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <GraduationCap size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-800">No tenés clases asignadas aún</p>
          <p className="mt-1 text-sm text-slate-500">
            Cuando administración asigne tus cursos del ciclo actual aparecerán acá.
          </p>
        </div>
      ) : (
        <>
          {/* Filtros rápidos (siempre visibles sin ocultar resultados) */}
          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <FilterChips
                label="Filtrar por día"
                value={vista}
                onChange={setVista}
                options={[
                  { value: "todas", label: `Todas (${clases.length})` },
                  { value: "hoy", label: `Hoy (${clasesHoyCount})` },
                ]}
              />
              {aniosDisponibles.length > 1 && (
                <FilterChips
                  label="Filtrar por año"
                  value={anioFiltro}
                  onChange={setAnioFiltro}
                  options={[
                    { value: "", label: "Todos los años" },
                    ...aniosDisponibles.map((anio) => ({ value: anio, label: `${anio}°` })),
                  ]}
                />
              )}
            </div>

            <label className="relative block w-full lg:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar materia o curso..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </section>

          {diasOrdenados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Calendar size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-800">
                {vista === "hoy" ? "No tenés clases programadas para hoy" : "No hay clases con esos filtros"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setVista("todas");
                  setAnioFiltro("");
                  setBusqueda("");
                }}
                className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-secondary hover:bg-blue-100"
              >
                Ver todas mis clases
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {diasOrdenados.map(([dia, listaDia]) => {
                const hoy = esHoy(dia);
                return (
                  <section
                    key={dia}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                      hoy ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200/80"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b px-5 py-3 ${
                        hoy
                          ? "border-blue-100 bg-blue-50/70 text-secondary"
                          : "border-slate-100 bg-canvas/70 text-navy"
                      }`}
                    >
                      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <Calendar size={15} aria-hidden="true" />
                        {dia}
                      </h2>
                      {hoy && (
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-white">
                          HOY
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100">
                      {listaDia.map((clase) => {
                        const id = clase._id || clase.id;
                        return (
                          <article
                            key={id}
                            className="flex flex-col justify-between gap-4 p-5 transition hover:bg-blue-50/30 lg:flex-row lg:items-center"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  to={`/profesor/Clases/${id}`}
                                  className="text-lg font-bold text-navy transition hover:text-secondary"
                                >
                                  {clase.materia?.nombre || "Materia sin nombre"}
                                </Link>
                                <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                  {clase.nivel ?? clase.anio}° &quot;{clase.division}&quot;
                                </span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <Clock size={14} aria-hidden="true" />
                                  {clase.horario || `${clase.horaInicio || "?"} - ${clase.horaFin || "?"}`}
                                </span>
                                {clase.aula && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin size={14} aria-hidden="true" />
                                    Aula {clase.aula}
                                  </span>
                                )}
                                {typeof clase.alumnosCount === "number" && (
                                  <span className="inline-flex items-center gap-1">
                                    <Users size={14} aria-hidden="true" />
                                    {clase.alumnosCount} alumno{clase.alumnosCount === 1 ? "" : "s"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Accesos directos de 1 clic al espacio de la materia */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/profesor/Clases/${id}?tab=asistencia`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-secondary"
                              >
                                <CalendarCheck size={14} aria-hidden="true" />
                                Asistencia
                              </Link>
                              <Link
                                to={`/profesor/Clases/${id}?tab=tareas`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-secondary"
                              >
                                <FileText size={14} aria-hidden="true" />
                                Tareas
                              </Link>
                              <Link
                                to={`/profesor/Clases/${id}?tab=notas`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-secondary"
                              >
                                <GraduationCap size={14} aria-hidden="true" />
                                Notas
                              </Link>
                              <Link
                                to={`/profesor/Clases/${id}`}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800"
                              >
                                Abrir materia
                                <ArrowRight size={14} aria-hidden="true" />
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Clases;
