import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  MapPin,
  User,
} from "lucide-react";
import { getMisClasesAlumno } from "../../api/api";
import FilterChips from "../../components/admin/FilterChips";

const ordenDias = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

const dayToday = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date());

const getDia = (clase) => clase.diaSemana || clase.dia || "Sin Día";
const getHoraInicio = (clase) => clase.horaInicio || clase.horarioInicio || "";
const getHoraFin = (clase) => clase.horaFin || clase.horarioFin || "";

const getProfesoresText = (clase) => {
  if (Array.isArray(clase.profesores) && clase.profesores.length > 0) {
    return clase.profesores
      .map((profesor) => [profesor.nombre, profesor.apellido].filter(Boolean).join(" "))
      .join(", ");
  }
  return "A designar";
};

const Materias = ({ defaultTab = "materias" }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("vista");
  const activeTab =
    requestedView === "materias" || requestedView === "horario"
      ? requestedView
      : defaultTab;

  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [diaFilter, setDiaFilter] = useState("");

  useEffect(() => {
    let active = true;
    const cargarClases = async () => {
      try {
        const res = await getMisClasesAlumno();
        if (!active) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.clases || [];
        setClases(data);
      } catch (err) {
        console.error("Error al cargar materias del alumno:", err);
        if (active) setError("No se pudieron cargar tus materias y horarios.");
      } finally {
        if (active) setLoading(false);
      }
    };
    cargarClases();
    return () => {
      active = false;
    };
  }, []);

  const changeTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("vista", nextTab);
    setSearchParams(next, { replace: true });
  };

  // Vista 1: Agrupadas por materia única (inscripciones activas + horarios)
  const materiasAgrupadas = useMemo(() => {
    const map = new Map();
    clases.forEach((clase) => {
      const materiaId = clase.materia?._id || clase._id;
      if (!map.has(materiaId)) {
        map.set(materiaId, {
          _id: materiaId,
          nombre: clase.materia?.nombre || "Materia sin nombre",
          anio: clase.anio ?? clase.materia?.anio,
          division: clase.division ?? clase.materia?.division,
          profesores: getProfesoresText(clase),
          horarios: [],
        });
      }
      map.get(materiaId).horarios.push({
        id: clase._id,
        dia: getDia(clase),
        horaInicio: getHoraInicio(clase),
        horaFin: getHoraFin(clase),
        aula: clase.aula,
      });
    });

    return [...map.values()].map((materia) => ({
      ...materia,
      horarios: materia.horarios.sort(
        (a, b) =>
          (ordenDias[a.dia] || 7) - (ordenDias[b.dia] || 7) ||
          a.horaInicio.localeCompare(b.horaInicio),
      ),
    }));
  }, [clases]);

  // Vista 2: Cronograma semanal por día (absorbe InscripcionMaterias.jsx)
  const clasesPorDia = useMemo(() => {
    const grouped = clases.reduce((acc, clase) => {
      const dia = getDia(clase);
      if (!acc[dia]) acc[dia] = [];
      acc[dia].push(clase);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => (ordenDias[a] || 7) - (ordenDias[b] || 7))
      .map((dia) => ({
        dia,
        clases: [...grouped[dia]].sort((a, b) => getHoraInicio(a).localeCompare(getHoraInicio(b))),
      }));
  }, [clases]);

  const diaOptions = useMemo(
    () => [
      { value: "", label: "Toda la semana" },
      ...clasesPorDia.map(({ dia }) => ({ value: dia, label: dia })),
    ],
    [clasesPorDia],
  );

  const diasVisibles = useMemo(() => {
    if (!diaFilter) return clasesPorDia;
    return clasesPorDia.filter((item) => item.dia === diaFilter);
  }, [clasesPorDia, diaFilter]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <BookOpen size={14} /> Cursada actual
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">
            Mis materias y horario
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Consulta las materias en las que estás inscripto, tus docentes y el cronograma semanal.
          </p>
        </div>

        <nav
          aria-label="Vista de materias"
          className="inline-flex rounded-2xl border border-slate-200 bg-canvas p-1"
        >
          <button
            type="button"
            onClick={() => changeTab("materias")}
            aria-current={activeTab === "materias" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "materias"
                ? "bg-white text-secondary shadow-sm"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            <BookOpen size={16} />
            Mis materias ({materiasAgrupadas.length})
          </button>
          <button
            type="button"
            onClick={() => changeTab("horario")}
            aria-current={activeTab === "horario" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "horario"
                ? "bg-white text-secondary shadow-sm"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            <Calendar size={16} />
            Horario semanal
          </button>
        </nav>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-2xl bg-white p-5 shadow-sm" />
          ))}
        </div>
      ) : clases.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-sm">
          <BookOpen size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-navy">Todavía no tienes materias asignadas</p>
          <p className="mt-1 text-sm text-slate-500">
            Cuando la administración registre tus inscripciones aparecerán aquí con su horario.
          </p>
        </div>
      ) : activeTab === "materias" ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materiasAgrupadas.map((materia) => (
            <article
              key={materia._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                    <BookOpen size={19} />
                  </span>
                  {materia.anio && (
                    <span className="rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {materia.anio}° {materia.division || ""}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-bold text-navy">{materia.nombre}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <User size={13} className="shrink-0 text-slate-400" />
                  <span>Prof. {materia.profesores}</span>
                </p>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                  {materia.horarios.map((horario) => (
                    <div
                      key={horario.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-canvas px-2.5 py-1.5 text-xs"
                    >
                      <span className="font-semibold text-navy">{horario.dia}</span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Clock size={12} />
                        {horario.horaInicio}–{horario.horaFin}
                      </span>
                      {horario.aula && (
                        <span className="inline-flex items-center gap-1 text-secondary">
                          <MapPin size={11} />
                          {horario.aula}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <Link
                  to={`/alumno/tareas?materiaId=${materia._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-blue-900"
                >
                  <FileText size={14} />
                  Ver tareas <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="space-y-4">
          {clasesPorDia.length > 1 && (
            <FilterChips
              label="Filtrar horario por día"
              options={diaOptions}
              value={diaFilter}
              onChange={setDiaFilter}
            />
          )}

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {diasVisibles.map(({ dia, clases: listaClases }) => {
              const isToday = dia.toLocaleLowerCase("es-AR") === dayToday.toLocaleLowerCase("es-AR");
              return (
                <div
                  key={dia}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                    isToday ? "border-secondary ring-2 ring-blue-100" : "border-slate-200/80"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b px-4 py-3.5 ${
                      isToday ? "border-blue-100 bg-blue-50/70" : "border-slate-100 bg-canvas"
                    }`}
                  >
                    <h2 className="text-base font-bold text-navy">{dia}</h2>
                    {isToday && (
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        Hoy
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    {listaClases.map((clase) => (
                      <div
                        key={clase._id}
                        className="rounded-xl border border-slate-100 bg-white p-3.5 transition hover:border-blue-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-navy">
                            {clase.materia?.nombre || "Materia sin nombre"}
                          </h3>
                          <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                            {getHoraInicio(clase)}–{getHoraFin(clase)}
                          </span>
                        </div>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <User size={12} className="shrink-0" />
                          Prof. {getProfesoresText(clase)}
                        </p>
                        {clase.aula && (
                          <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <MapPin size={11} />
                            Aula {clase.aula}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
};

export default Materias;
