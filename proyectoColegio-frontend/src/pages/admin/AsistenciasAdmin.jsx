import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  FileDown,
  Loader2,
  Save,
  School,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import {
  compararAsistencias,
  getAsistenciaGeneral,
  getReporteAsistencias,
  getReporteAsistenciasMensual,
  getTodasLasClases,
  registrarAsistenciaGeneral,
} from "../../api/api";
import { CycleStatusNotice } from "../../components/admin/CycleSelector";
import FilterChips from "../../components/admin/FilterChips";
import ModalExportarPlanilla from "../../components/ModalExportarPlanilla";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import { crearPlanillaAsistenciaMensual } from "../../utils/exportadores/planillasAcademicas.js";

const getFechaLocal = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const aniosDisponibles = ["1", "2", "3", "4", "5", "6"];
const divisionesDisponibles = ["A", "B", "C", "D"];
const estadosAsistencia = ["presente", "ausente", "tarde", "justificado"];

const estadoBadgeStyles = {
  presente: "bg-emerald-50 text-emerald-700",
  ausente: "bg-red-50 text-red-700",
  tarde: "bg-amber-50 text-amber-800",
  justificado: "bg-blue-50 text-secondary",
};

const estadoButtonActive = {
  presente: "bg-emerald-600 text-white shadow-sm",
  ausente: "bg-red-600 text-white shadow-sm",
  tarde: "bg-amber-500 text-white shadow-sm",
  justificado: "bg-secondary text-white shadow-sm",
};

const estadoButtonInactive = {
  presente: "bg-canvas text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
  ausente: "bg-canvas text-slate-600 hover:bg-red-50 hover:text-red-700",
  tarde: "bg-canvas text-slate-600 hover:bg-amber-50 hover:text-amber-800",
  justificado: "bg-canvas text-slate-600 hover:bg-blue-50 hover:text-secondary",
};

const historialModeOptions = [
  { value: "materias", label: "Historial por clase" },
  { value: "comparacion", label: "Comparación avanzada" },
];

const AsistenciasAdmin = ({ defaultTab = "registrar" }) => {
  const { cycleId, selectedCycle } = useAcademicCycles();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab =
    requestedTab === "registrar" || requestedTab === "historial"
      ? requestedTab
      : defaultTab;

  // --- Estado Pestaña 1: Registrar asistencia general ---
  const [anio, setAnio] = useState("");
  const [division, setDivision] = useState("");
  const [fechaRegistro, setFechaRegistro] = useState(getFechaLocal);
  const [alumnos, setAlumnos] = useState([]);
  const [asistenciasRegistro, setAsistenciasRegistro] = useState({});
  const [loadingRegistro, setLoadingRegistro] = useState(false);
  const [savingRegistro, setSavingRegistro] = useState(false);
  const [filtrosCargados, setFiltrosCargados] = useState(null);

  // --- Estado Pestaña 2: Historial y Comparación ---
  const [modoHistorial, setModoHistorial] = useState("materias");
  const [clases, setClases] = useState([]);
  const [asistenciasHistorial, setAsistenciasHistorial] = useState([]);
  const [comparacion, setComparacion] = useState(null);
  const [cursoHistorial, setCursoHistorial] = useState({ anio: "", division: "" });
  const [filtrosHistorial, setFiltrosHistorial] = useState({
    fecha: getFechaLocal(),
    claseId: "",
  });
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [exportandoMensual, setExportandoMensual] = useState(false);
  const [modalPlanillaAbierto, setModalPlanillaAbierto] = useState(false);
  const [documentoPlanilla, setDocumentoPlanilla] = useState(null);

  const readOnly = selectedCycle?.estado === "CERRADO";

  const changeTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!cycleId) {
      setClases([]);
      return;
    }
    let active = true;
    const fetchClases = async () => {
      try {
        const res = await getTodasLasClases({ cicloLectivoId: cycleId });
        if (!active) return;
        setClases(res.data?.clases || res.data || []);
      } catch (error) {
        console.error("Error cargando clases para historial de asistencias:", error);
        if (active) toast.error("Error al cargar la lista de clases.");
      }
    };
    fetchClases();
    return () => {
      active = false;
    };
  }, [cycleId]);

  useEffect(() => {
    setFiltrosHistorial((current) => ({ ...current, claseId: "" }));
    setAsistenciasHistorial([]);
    setComparacion(null);
  }, [cycleId]);

  // --- Acciones Pestaña 1: Registrar ---
  const fetchAlumnosYAsistencia = async () => {
    if (!anio || !division || !fechaRegistro) {
      toast.info("Selecciona año, división y fecha para cargar la lista.");
      return;
    }
    setLoadingRegistro(true);
    setAlumnos([]);
    setAsistenciasRegistro({});
    setFiltrosCargados(null);
    try {
      const { data } = await getAsistenciaGeneral(anio, division, fechaRegistro);
      const lista = Array.isArray(data) ? data : [];
      setAlumnos(lista);
      setAsistenciasRegistro(
        Object.fromEntries(lista.map(({ _id, estado }) => [_id, estado || "presente"])),
      );
      setFiltrosCargados({ anio, division, fecha: fechaRegistro });
      if (lista.length === 0) toast.warn(`No se encontraron alumnos para ${anio}° ${division}.`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Error al cargar alumnos o asistencias.");
    } finally {
      setLoadingRegistro(false);
    }
  };

  const cambiarEstadoAsistencia = (alumnoId, estado) => {
    setAsistenciasRegistro((current) => ({ ...current, [alumnoId]: estado }));
  };

  const marcarTodos = (estado) => {
    if (!alumnos.length) return;
    setAsistenciasRegistro(
      Object.fromEntries(alumnos.map((alumno) => [alumno._id, estado])),
    );
  };

  const guardarAsistencia = async () => {
    if (alumnos.length === 0) {
      toast.error("No hay alumnos en la lista para guardar.");
      return;
    }
    if (
      !filtrosCargados ||
      filtrosCargados.anio !== anio ||
      filtrosCargados.division !== division ||
      filtrosCargados.fecha !== fechaRegistro
    ) {
      toast.error("Vuelve a cargar los alumnos para el curso y fecha seleccionados.");
      return;
    }
    setSavingRegistro(true);
    try {
      await registrarAsistenciaGeneral({
        anio,
        division,
        fecha: fechaRegistro,
        asistencias: Object.entries(asistenciasRegistro).map(([alumno, estado]) => ({
          alumno,
          estado,
        })),
      });
      toast.success("Asistencia general registrada correctamente.");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Error al guardar asistencia.");
    } finally {
      setSavingRegistro(false);
    }
  };

  const resumenRegistro = useMemo(() => {
    return Object.values(asistenciasRegistro).reduce(
      (summary, estado) => {
        if (Object.hasOwn(summary, estado)) summary[estado] += 1;
        return summary;
      },
      { presente: 0, ausente: 0, tarde: 0, justificado: 0 },
    );
  }, [asistenciasRegistro]);

  // --- Acciones Pestaña 2: Historial ---
  const fetchReporte = async () => {
    if (!filtrosHistorial.claseId || !filtrosHistorial.fecha) {
      toast.warn("Por favor selecciona una clase y una fecha.");
      return;
    }
    setLoadingHistorial(true);
    try {
      const res = await getReporteAsistencias(
        filtrosHistorial.claseId,
        filtrosHistorial.fecha,
        cycleId,
      );
      const registros = Array.isArray(res.data) ? res.data : [];
      setAsistenciasHistorial(registros);
      if (registros.length === 0) toast.info("No hay asistencias registradas para esa fecha.");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Error al cargar el reporte.");
    } finally {
      setLoadingHistorial(false);
    }
  };

  const fetchComparacion = async () => {
    if (!cursoHistorial.anio || !cursoHistorial.division || !filtrosHistorial.fecha) {
      toast.warn("Selecciona año, división y fecha.");
      return;
    }
    setLoadingHistorial(true);
    setComparacion(null);
    try {
      const { data } = await compararAsistencias(
        cursoHistorial.anio,
        cursoHistorial.division,
        filtrosHistorial.fecha,
        cycleId,
      );
      setComparacion(data);
      if (data.alumnos.length === 0) toast.info("No hay alumnos registrados en ese curso.");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Error al comparar las asistencias.");
    } finally {
      setLoadingHistorial(false);
    }
  };

  const exportarAsistenciaMensual = async () => {
    if (!filtrosHistorial.claseId || !filtrosHistorial.fecha || !cycleId) {
      toast.warn("Selecciona una clase y una fecha para exportar.");
      return;
    }
    setExportandoMensual(true);
    try {
      const mes = filtrosHistorial.fecha.slice(0, 7);
      const { data } = await getReporteAsistenciasMensual(
        filtrosHistorial.claseId,
        mes,
        cycleId,
      );
      setDocumentoPlanilla(
        crearPlanillaAsistenciaMensual({
          reporte: data,
          ciclo: selectedCycle || {},
          mes,
        }),
      );
      setModalPlanillaAbierto(true);
    } catch (error) {
      console.error("Error preparando la planilla mensual de asistencias:", error);
      toast.error(error.response?.data?.msg || "No se pudo preparar la planilla mensual.");
    } finally {
      setExportandoMensual(false);
    }
  };

  const resumenHistorial = useMemo(() => {
    return asistenciasHistorial.reduce(
      (summary, asistencia) => {
        if (Object.hasOwn(summary, asistencia.estado)) summary[asistencia.estado] += 1;
        return summary;
      },
      { presente: 0, ausente: 0, tarde: 0, justificado: 0 },
    );
  }, [asistenciasHistorial]);

  const renderBadge = (estado) => (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
        estadoBadgeStyles[estado] || "bg-canvas text-slate-600"
      }`}
    >
      {estado}
    </span>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <CalendarCheck size={14} /> Gestión Académica
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Asistencias</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Registra la asistencia general diaria por curso o consulta el historial y comparaciones.
          </p>
        </div>

        <nav
          aria-label="Vistas de asistencia"
          className="inline-flex rounded-2xl border border-slate-200 bg-canvas p-1"
        >
          <button
            type="button"
            onClick={() => changeTab("registrar")}
            aria-current={activeTab === "registrar" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "registrar"
                ? "bg-white text-secondary shadow-sm"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            <CalendarCheck size={16} />
            Registrar
          </button>
          <button
            type="button"
            onClick={() => changeTab("historial")}
            aria-current={activeTab === "historial" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "historial"
                ? "bg-white text-secondary shadow-sm"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            <CalendarDays size={16} />
            Historial
          </button>
        </nav>
      </header>

      <CycleStatusNotice cycle={selectedCycle} />

      {activeTab === "registrar" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fechaRegistro}
                  onChange={(event) => setFechaRegistro(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Año
                </label>
                <select
                  value={anio}
                  onChange={(event) => setAnio(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Seleccionar año</option>
                  {aniosDisponibles.map((item) => (
                    <option key={item} value={item}>
                      {item}° Año
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  División
                </label>
                <select
                  value={division}
                  onChange={(event) => setDivision(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">División</option>
                  {divisionesDisponibles.map((item) => (
                    <option key={item} value={item}>
                      División {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={fetchAlumnosYAsistencia}
                  disabled={loadingRegistro}
                  className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingRegistro ? <Loader2 size={17} className="animate-spin" /> : <Users size={17} />}
                  {loadingRegistro ? "Cargando..." : "Cargar alumnos"}
                </button>
              </div>
            </div>
          </section>

          {loadingRegistro ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-secondary" />
              <p className="mt-3 text-sm text-slate-500">Cargando nómina de alumnos...</p>
            </div>
          ) : alumnos.length > 0 ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
                    <UserCheck size={19} className="text-secondary" />
                    Lista de alumnos ({alumnos.length})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Presentes: {resumenRegistro.presente} · Ausentes: {resumenRegistro.ausente} · Tarde:{" "}
                    {resumenRegistro.tarde} · Justificados: {resumenRegistro.justificado}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => marcarTodos("presente")}
                    disabled={readOnly}
                    className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
                  >
                    Todos presentes
                  </button>
                  <button
                    type="button"
                    onClick={() => marcarTodos("ausente")}
                    disabled={readOnly}
                    className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                  >
                    Todos ausentes
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {alumnos.map((alumno) => (
                  <div
                    key={alumno._id}
                    className="flex flex-col justify-between gap-3 px-5 py-3.5 transition hover:bg-blue-50/30 md:flex-row md:items-center sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-secondary">
                        {alumno.nombre?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{alumno.nombre}</p>
                        <p className="truncate text-xs text-slate-500">{alumno.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-1.5">
                      {estadosAsistencia.map((estado) => {
                        const isActive = asistenciasRegistro[alumno._id] === estado;
                        return (
                          <button
                            key={estado}
                            type="button"
                            disabled={readOnly}
                            onClick={() => cambiarEstadoAsistencia(alumno._id, estado)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isActive ? estadoButtonActive[estado] : estadoButtonInactive[estado]
                            }`}
                          >
                            {estado}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-canvas px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={guardarAsistencia}
                  disabled={savingRegistro || loadingRegistro || readOnly}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {savingRegistro ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {savingRegistro ? "Guardando..." : "Guardar asistencia"}
                </button>
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-sm">
              <School size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-navy">
                {!anio || !division
                  ? "Selecciona año, división y fecha"
                  : "No hay alumnos cargados para este curso"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {!anio || !division
                  ? "Luego presiona «Cargar alumnos» para registrar la asistencia general del día."
                  : "Verifica el curso seleccionado o intenta con otra división."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <FilterChips
                label="Modo de consulta"
                options={historialModeOptions}
                value={modoHistorial}
                onChange={setModoHistorial}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {modoHistorial === "materias" ? (
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Clase / Materia
                  </label>
                  <select
                    value={filtrosHistorial.claseId}
                    onChange={(event) => {
                      setFiltrosHistorial((current) => ({ ...current, claseId: event.target.value }));
                      setAsistenciasHistorial([]);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Selecciona una clase</option>
                    {clases.map((clase) => (
                      <option key={clase._id || clase.id} value={clase._id || clase.id}>
                        {clase.materia?.nombre || "Materia"} — {clase.anio}° {clase.division} ·{" "}
                        {clase.diaSemana} · {clase.horaInicio}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Año
                    </label>
                    <select
                      value={cursoHistorial.anio}
                      onChange={(event) => {
                        setCursoHistorial((current) => ({ ...current, anio: event.target.value }));
                        setComparacion(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">Seleccionar año</option>
                      {aniosDisponibles.map((item) => (
                        <option key={item} value={item}>
                          {item}° Año
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      División
                    </label>
                    <select
                      value={cursoHistorial.division}
                      onChange={(event) => {
                        setCursoHistorial((current) => ({ ...current, division: event.target.value }));
                        setComparacion(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">División</option>
                      {divisionesDisponibles.map((item) => (
                        <option key={item} value={item}>
                          División {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Fecha
                </label>
                <input
                  type="date"
                  value={filtrosHistorial.fecha}
                  onChange={(event) => {
                    setFiltrosHistorial((current) => ({ ...current, fecha: event.target.value }));
                    setAsistenciasHistorial([]);
                    setComparacion(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={modoHistorial === "materias" ? fetchReporte : fetchComparacion}
                  disabled={loadingHistorial}
                  className="inline-flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
                >
                  {loadingHistorial ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : modoHistorial === "materias" ? (
                    <Search size={17} />
                  ) : (
                    <ClipboardCheck size={17} />
                  )}
                  {modoHistorial === "materias" ? "Consultar" : "Comparar"}
                </button>

                {modoHistorial === "materias" && (
                  <button
                    type="button"
                    onClick={exportarAsistenciaMensual}
                    disabled={exportandoMensual || !filtrosHistorial.claseId || !filtrosHistorial.fecha}
                    title="Exportar planilla mensual"
                    className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 text-sm font-semibold text-secondary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {exportandoMensual ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                    <span className="hidden sm:inline">Mes</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {modoHistorial === "comparacion" ? (
            comparacion ? (
              <section className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[
                    ["Alumnos", comparacion.resumen.alumnos],
                    ["Sin control general", comparacion.resumen.generalSinRegistrar],
                    ["Materias del día", comparacion.resumen.clases],
                    ["Materias incompletas", comparacion.resumen.clasesSinAsistencia],
                    ["Diferencias", comparacion.resumen.discrepancias],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 font-bold text-navy">
                    Clases programadas — {comparacion.diaSemana}, {comparacion.fecha}
                  </h2>
                  {comparacion.clases.length ? (
                    <div className="flex flex-wrap gap-2">
                      {comparacion.clases.map((clase) => (
                        <span key={clase._id} className="rounded-xl bg-canvas px-3 py-2 text-xs font-medium text-slate-700">
                          {clase.horaInicio} {clase.materia}: {clase.asistenciasRegistradas}/
                          {clase.alumnosInscritos} registradas
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No hay clases programadas para este curso ese día.</p>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  {comparacion.alumnos.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 bg-canvas text-xs font-bold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-4">Alumno</th>
                            <th className="px-5 py-4">Control general</th>
                            <th className="px-5 py-4">Asistencia por materia</th>
                            <th className="px-5 py-4">Diferencias</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {comparacion.alumnos.map((alumno) => (
                            <tr key={alumno._id} className="align-top transition hover:bg-blue-50/40">
                              <td className="px-5 py-4 font-semibold text-navy">{alumno.nombre}</td>
                              <td className="px-5 py-4">{renderBadge(alumno.estadoGeneral || "sin registro")}</td>
                              <td className="px-5 py-4">
                                {alumno.materias.length ? (
                                  <div className="space-y-2">
                                    {alumno.materias.map((materia) => (
                                      <div key={materia.claseId} className="flex flex-wrap items-center gap-2">
                                        <span className="text-slate-700">
                                          {materia.horaInicio} {materia.materia}
                                        </span>
                                        {renderBadge(materia.estado || "sin registro")}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Sin clases inscriptas ese día</span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                {alumno.diferencias.length ? (
                                  <div className="space-y-2">
                                    {alumno.diferencias.map((diferencia) => (
                                      <div
                                        key={`${diferencia.materia}-${diferencia.horaInicio}`}
                                        className="flex items-start gap-2 text-amber-800"
                                      >
                                        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                                        <span>
                                          {diferencia.estadoProfesor
                                            ? `${diferencia.materia}: general ${diferencia.estadoGeneral}, clase ${diferencia.estadoProfesor}`
                                            : `${diferencia.materia}: el docente aún no cargó la asistencia`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Sin diferencias registradas</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-sm text-slate-400">No hay alumnos para mostrar.</div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  La comparación solo informa diferencias; no modifica ni reemplaza las asistencias cargadas por los docentes.
                </p>
              </section>
            ) : !loadingHistorial ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                Selecciona un curso y una fecha para comparar los registros generales con los de cada materia.
              </div>
            ) : null
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              {asistenciasHistorial.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 sm:grid-cols-4 sm:p-5">
                    {[
                      ["Presentes", resumenHistorial.presente, "text-emerald-700"],
                      ["Ausentes", resumenHistorial.ausente, "text-red-700"],
                      ["Tarde", resumenHistorial.tarde, "text-amber-700"],
                      ["Justificados", resumenHistorial.justificado, "text-secondary"],
                    ].map(([label, count, color]) => (
                      <div key={label} className="rounded-xl bg-canvas px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                        <p className={`mt-1 text-2xl font-bold ${color}`}>{count}</p>
                      </div>
                    ))}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {asistenciasHistorial.map((asis) => (
                      <div
                        key={asis._id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-navy">{asis.alumno?.nombre || "Alumno desconocido"}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            {asis.cargadoPor?.rol === "admin" ? (
                              <ShieldCheck size={14} className="text-indigo-600" aria-label="Administrador" />
                            ) : (
                              <User size={14} aria-label="Docente" />
                            )}
                            <span>{asis.cargadoPor?.nombre || "Sistema"}</span>
                            {asis.updatedAt && (
                              <>
                                <span aria-hidden="true">·</span>
                                <Clock size={12} aria-hidden="true" />
                                <span>
                                  {new Date(asis.updatedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {renderBadge(asis.estado)}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-6 py-14 text-center">
                  <CalendarDays size={36} className="mx-auto text-slate-300" />
                  <p className="mt-3 font-semibold text-navy">No hay registros para mostrar</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Elige una clase y una fecha y presiona «Consultar» para ver el historial.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <ModalExportarPlanilla
        abierto={modalPlanillaAbierto}
        onCerrar={() => setModalPlanillaAbierto(false)}
        documento={documentoPlanilla}
      />
    </div>
  );
};

export default AsistenciasAdmin;
