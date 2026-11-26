import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  Calendar,
  CircleCheck,
  Clock,
  Edit3,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import { CycleStatusNotice } from "../../components/admin/CycleSelector";
import DataTable from "../../components/admin/DataTable";
import FilterChips from "../../components/admin/FilterChips";
import Toast from "../../components/admin/Toast";
import ClaseDetailDrawer from "./ClaseDetailDrawer";
import {
  getMaterias,
  getProfesores,
  getTodasLasClases,
  setClaseActive,
} from "../../api/api";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const yearOptions = [
  { value: "", label: "Todos los años" },
  ...[1, 2, 3, 4, 5, 6].map((anio) => ({ value: String(anio), label: `${anio}°` })),
];
const statusOptions = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "suspended", label: "Suspendidas" },
];

const ClasesAdmin = () => {
  const { token } = useAuth();
  const { claseId: routeClaseId } = useParams();
  const navigate = useNavigate();
  const { cycleId, selectedCycle, loadingCycles } = useAcademicCycles();

  const [clases, setClases] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    anio: "",
    division: "",
    diaSemana: "",
    estado: "all",
    search: "",
  });

  // Estado del SlideOverDrawer unificado (crear / detalle con pestañas Alumnos y Datos)
  const [drawerState, setDrawerState] = useState({
    open: false,
    mode: "detail",
    claseId: null,
    initialTab: "alumnos",
  });

  const [notification, setNotification] = useState(null);
  const notificationId = useRef(0);
  const notify = useCallback((type, message) => {
    notificationId.current += 1;
    setNotification({ id: notificationId.current, type, message });
  }, []);
  const dismissNotification = useCallback(() => setNotification(null), []);

  const fetchClases = useCallback(async ({ silent = false } = {}) => {
    if (!cycleId) {
      setClases([]);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await getTodasLasClases({ includeSuspended: true, cicloLectivoId: cycleId });
      const data = Array.isArray(res.data) ? res.data : res.data?.clases || [];
      setClases(data);
    } catch (error) {
      console.error("Error al cargar las clases:", error);
      notify("error", "No se pudieron cargar las clases del ciclo.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [cycleId, notify]);

  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [resMaterias, resProfesores] = await Promise.all([getMaterias(), getProfesores()]);
      setMaterias(resMaterias.data || []);
      const listaProfes = resProfesores.data || [];
      setProfesoresList(listaProfes.filter((user) => user.rol === "profesor"));
    } catch (error) {
      console.error("Error al cargar materias o profesores:", error);
    }
  }, []);

  useEffect(() => {
    if (!token || loadingCycles) return;
    if (!cycleId) {
      setClases([]);
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchClases({ silent: true }), fetchAuxiliaryData()]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token, cycleId, loadingCycles, fetchClases, fetchAuxiliaryData]);

  // Si se accede desde búsqueda rápida (/admin/clases/:claseId/gestionar), abrir drawer en Alumnos
  useEffect(() => {
    if (!routeClaseId || loading || !clases.length) return;
    const match = clases.find((item) => String(item._id || item.id) === String(routeClaseId));
    if (!match) return;
    setDrawerState({
      open: true,
      mode: "detail",
      claseId: match._id || match.id,
      initialTab: "alumnos",
    });
  }, [routeClaseId, loading, clases]);

  useEffect(() => {
    if (!routeClaseId) {
      setDrawerState({ open: false, mode: "detail", claseId: null, initialTab: "alumnos" });
    }
  }, [cycleId, routeClaseId]);

  const divisionesDisponibles = useMemo(() => {
    const found = new Set(["A", "B", "C", "D"]);
    clases.forEach((clase) => {
      if (clase.division) found.add(String(clase.division).toUpperCase());
    });
    return [...found].sort();
  }, [clases]);

  const clasesFiltradas = useMemo(() => {
    const query = filter.search.trim().toLowerCase();
    return clases.filter((clase) => {
      const matchAnio = !filter.anio || String(clase.anio) === String(filter.anio);
      const matchDiv =
        !filter.division || String(clase.division || "").toUpperCase() === filter.division.toUpperCase();
      const matchDia = !filter.diaSemana || clase.diaSemana === filter.diaSemana;
      const matchEstado =
        filter.estado === "all" ||
        (filter.estado === "active" && clase.isActive) ||
        (filter.estado === "suspended" && !clase.isActive);
      const profesorText = (clase.profesores || [])
        .map((profesor) => `${profesor.nombre || ""} ${profesor.apellido || ""}`)
        .join(" ");
      const matchSearch =
        !query ||
        [clase.materia?.nombre, clase.aula, profesorText]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchAnio && matchDiv && matchDia && matchEstado && matchSearch;
    });
  }, [clases, filter]);

  const activeClase = useMemo(
    () => clases.find((item) => String(item._id || item.id) === String(drawerState.claseId)) || null,
    [clases, drawerState.claseId],
  );

  const readOnly = selectedCycle?.estado === "CERRADO";
  const hasActiveFilters = Boolean(
    filter.anio || filter.division || filter.diaSemana || filter.estado !== "all" || filter.search.trim(),
  );

  const openCreateDrawer = () => {
    setDrawerState({ open: true, mode: "create", claseId: null, initialTab: "datos" });
  };

  const openDetailDrawer = (clase, initialTab = "alumnos") => {
    setDrawerState({
      open: true,
      mode: "detail",
      claseId: clase._id || clase.id,
      initialTab,
    });
  };

  const closeDrawer = () => {
    setDrawerState({ open: false, mode: "detail", claseId: null, initialTab: "alumnos" });
    if (routeClaseId) {
      navigate("/admin/CrearClases", { replace: true });
    }
  };

  const handleToggleStatus = async (clase) => {
    if (readOnly) return;
    const isActive = !clase.isActive;
    const confirm = await Swal.fire({
      title: isActive ? "¿Reactivar clase?" : "¿Suspender clase?",
      text: isActive
        ? "La clase volverá a estar disponible para el curso."
        : "La clase se conservará, pero dejará de estar disponible para docentes y alumnos.",
      icon: isActive ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isActive ? "#059669" : "#d97706",
      confirmButtonText: isActive ? "Sí, reactivar" : "Sí, suspender",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;
    try {
      const response = await setClaseActive(clase._id, isActive);
      setClases((current) => current.map((item) => (item._id === clase._id ? response.data.clase : item)));
      notify("success", isActive ? "Clase reactivada correctamente." : "Clase suspendida correctamente.");
    } catch (error) {
      Swal.fire("Error", error.response?.data?.msg || "No se pudo cambiar el estado de la clase.", "error");
    }
  };

  const columns = [
    {
      key: "materia",
      label: "Materia / Curso",
      render: (clase) => (
        <button
          type="button"
          onClick={() => openDetailDrawer(clase, "alumnos")}
          className="flex items-start gap-3 text-left group"
        >
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
            <GraduationCap size={19} />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-navy group-hover:text-secondary transition-colors">
              {clase.materia?.nombre || "Sin nombre"}
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                {clase.anio}° &quot;{clase.division || "—"}&quot;
              </span>
              {clase.aula && (
                <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-xs text-slate-600">
                  <MapPin size={11} />
                  {clase.aula}
                </span>
              )}
            </span>
          </span>
        </button>
      ),
    },
    {
      key: "horario",
      label: "Horario",
      render: (clase) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-navy">
            <Calendar size={14} className="text-slate-400" />
            {clase.diaSemana || "A definir"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock size={13} className="text-slate-400" />
            {clase.horaInicio && clase.horaFin ? `${clase.horaInicio} - ${clase.horaFin} hs` : "Sin horario"}
          </div>
        </div>
      ),
    },
    {
      key: "profesores",
      label: "Docentes",
      render: (clase) =>
        clase.profesores && clase.profesores.length > 0 ? (
          <div className="space-y-1">
            {clase.profesores.map((profesor, index) => (
              <div key={profesor._id || index} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
                  {profesor.nombre ? profesor.nombre.charAt(0).toUpperCase() : "?"}
                </span>
                <span className="text-sm text-slate-700">
                  {profesor.nombre} {profesor.apellido || ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
            <AlertCircle size={14} /> Sin docente
          </span>
        ),
    },
    {
      key: "alumnos",
      label: "Alumnos / Estado",
      render: (clase) => {
        const count = clase.alumnosCount ?? (Array.isArray(clase.alumnos) ? clase.alumnos.length : 0);
        return (
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={() => openDetailDrawer(clase, "alumnos")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-navy transition hover:bg-blue-50 hover:text-secondary"
            >
              <Users size={13} />
              {count} inscripto{count === 1 ? "" : "s"}
            </button>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                clase.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
              }`}
            >
              {clase.isActive ? "Activa" : "Suspendida"}
            </span>
          </div>
        );
      },
    },
    {
      key: "acciones",
      label: "Acciones",
      headerClassName: "text-right",
      className: "text-right",
      render: (clase) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openDetailDrawer(clase, "alumnos")}
            title="Gestionar alumnos inscriptos"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary hover:text-white"
          >
            <Users size={14} />
            Alumnos
          </button>
          <button
            type="button"
            onClick={() => openDetailDrawer(clase, "datos")}
            title={readOnly ? "Ver configuración de clase" : "Editar clase"}
            aria-label={`Editar ${clase.materia?.nombre || "clase"}`}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-canvas hover:text-navy"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(clase)}
            disabled={readOnly}
            title={clase.isActive ? "Suspender clase" : "Reactivar clase"}
            aria-label={clase.isActive ? "Suspender clase" : "Reactivar clase"}
            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
              clase.isActive
                ? "text-amber-700 hover:bg-amber-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {clase.isActive ? <Ban size={16} /> : <CircleCheck size={16} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {notification && (
        <div className="fixed right-4 top-20 z-[80]">
          <Toast {...notification} onClose={dismissNotification} />
        </div>
      )}

      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <Calendar size={14} /> Gestión Académica
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Clases e inscripciones</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Administra horarios, docentes, aulas y alumnos inscriptos sin salir de esta pantalla.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDrawer}
          disabled={readOnly || !cycleId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Nueva clase
        </button>
      </header>

      <CycleStatusNotice cycle={selectedCycle} />

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterChips
              label="Filtrar por año"
              options={yearOptions}
              value={filter.anio}
              onChange={(anio) => setFilter((current) => ({ ...current, anio }))}
            />
            <FilterChips
              label="Filtrar por estado"
              options={statusOptions}
              value={filter.estado}
              onChange={(estado) => setFilter((current) => ({ ...current, estado }))}
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filter.search}
                onChange={(event) => setFilter((current) => ({ ...current, search: event.target.value }))}
                placeholder="Buscar por materia, docente o aula..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <select
              value={filter.division}
              onChange={(event) => setFilter((current) => ({ ...current, division: event.target.value }))}
              aria-label="Filtrar por división"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">Todas las divisiones</option>
              {divisionesDisponibles.map((division) => (
                <option key={division} value={division}>
                  División {division}
                </option>
              ))}
            </select>

            <select
              value={filter.diaSemana}
              onChange={(event) => setFilter((current) => ({ ...current, diaSemana: event.target.value }))}
              aria-label="Filtrar por día"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">Todos los días</option>
              {diasSemana.map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilter({ anio: "", division: "", diaSemana: "", estado: "all", search: "" })}
                className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-canvas hover:text-navy"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {!loading && (
            <p className="text-xs font-medium text-slate-500">
              Mostrando {clasesFiltradas.length} de {clases.length} clase{clases.length === 1 ? "" : "s"} del ciclo
              {selectedCycle ? ` ${selectedCycle.nombre}` : ""}.
            </p>
          )}
        </div>

        <DataTable
          rows={clasesFiltradas}
          columns={columns}
          loading={loading || loadingCycles}
          emptyState={
            <div className="mx-auto max-w-sm">
              <GraduationCap size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-navy">
                {hasActiveFilters ? "No encontramos clases con estos filtros" : "Aún no hay clases en este ciclo"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {hasActiveFilters
                  ? "Prueba ajustando los filtros para ver otros cursos."
                  : "Crea la primera clase para asignar docentes, horario e inscribir alumnos."}
              </p>
              {!readOnly && cycleId && (
                <button
                  type="button"
                  onClick={openCreateDrawer}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  <Plus size={16} /> Nueva clase
                </button>
              )}
            </div>
          }
        />
      </section>

      {drawerState.open && (
        <ClaseDetailDrawer
          clase={drawerState.mode === "create" ? null : activeClase}
          mode={drawerState.mode}
          initialTab={drawerState.initialTab}
          materias={materias}
          profesoresList={profesoresList}
          cycleId={cycleId}
          selectedCycle={selectedCycle}
          onClose={closeDrawer}
          onSaved={() => {
            closeDrawer();
            fetchClases({ silent: true });
          }}
          onAlumnosChanged={() => fetchClases({ silent: true })}
          onStatusChanged={(updatedClase) => {
            setClases((current) =>
              current.map((item) => (item._id === updatedClase._id ? updatedClase : item)),
            );
          }}
          onNotify={notify}
        />
      )}
    </div>
  );
};

export default ClasesAdmin;
