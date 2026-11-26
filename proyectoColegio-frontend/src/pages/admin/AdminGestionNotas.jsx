import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileClock,
  FileEdit,
  Filter,
  GraduationCap,
  Loader2,
  Search,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { getTodasLasClases } from "../../api/api";
import { CycleStatusNotice } from "../../components/admin/CycleSelector";
import FilterChips from "../../components/admin/FilterChips";
import { useAuth } from "../../context/AuthContext";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import CargarNotas from "../profesor/CargarNotas";
import AdminAuditoriaNotas from "./AdminPanelNotas";

const yearOptions = [
  { value: "", label: "Todos los años" },
  ...["1", "2", "3", "4", "5", "6"].map((anio) => ({ value: anio, label: `${anio}°` })),
];

const defaultDivisions = ["A", "B", "C", "D"];

const AdminGestionNotas = ({ defaultTab = "planilla" }) => {
  const { token } = useAuth();
  const { cycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab =
    requestedTab === "planilla" || requestedTab === "auditoria"
      ? requestedTab
      : defaultTab;

  const [allMaterias, setAllMaterias] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMateriaId, setSelectedMateriaId] = useState("");
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  const hasActiveFilters = Boolean(selectedAnio || selectedDivision || searchTerm.trim());

  const changeTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
  };

  // Solo consulta materias/clases cuando el usuario aplica al menos un filtro
  useEffect(() => {
    if (loadingCycles) return;
    if (!cycleId || !hasActiveFilters) {
      setAllMaterias([]);
      setSelectedMateriaId("");
      setLoadingMaterias(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setLoadingMaterias(true);
      try {
        const params = {
          cicloLectivoId: cycleId,
          ...(selectedAnio ? { anio: selectedAnio } : {}),
          ...(selectedDivision ? { division: selectedDivision } : {}),
        };
        const res = await getTodasLasClases(params);
        if (!active) return;
        const classes = Array.isArray(res.data) ? res.data : res.data?.clases || [];
        const uniqueSubjects = new Map();
        classes.forEach((clase) => {
          const materiaId = clase.materia?._id || clase.materiaId;
          if (!materiaId || !clase.materia?.nombre) return;
          const key = `${materiaId}:${clase.nivel ?? clase.anio}:${clase.division}`;
          if (!uniqueSubjects.has(key)) {
            uniqueSubjects.set(key, {
              _id: materiaId,
              claseId: clase._id || clase.id,
              nombre: clase.materia.nombre,
              anio: clase.nivel ?? clase.anio,
              division: clase.division,
              profesor: clase.profesores?.[0] || null,
              turno: clase.turno,
              horaInicio: clase.horaInicio,
              horaFin: clase.horaFin,
            });
          }
        });
        setAllMaterias([...uniqueSubjects.values()]);
      } catch (err) {
        if (!active) return;
        console.error("Error cargando clases del ciclo:", err);
        toast.error(err.response?.data?.msg || "Error al cargar las materias del ciclo.");
      } finally {
        if (active) setLoadingMaterias(false);
      }
    }, searchTerm.trim() ? 220 : 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [token, cycleId, loadingCycles, hasActiveFilters, selectedAnio, selectedDivision, searchTerm]);

  useEffect(() => {
    setSelectedMateriaId("");
  }, [cycleId]);

  const divisionesDisponibles = useMemo(() => {
    const found = new Set(defaultDivisions);
    allMaterias.forEach((materia) => {
      if (materia.division) found.add(String(materia.division).toUpperCase());
    });
    return [...found].sort();
  }, [allMaterias]);

  const filteredMaterias = useMemo(() => {
    if (!hasActiveFilters) return [];
    const query = searchTerm.trim().toLowerCase();
    return allMaterias.filter(
      (materia) =>
        (!selectedAnio || String(materia.anio) === selectedAnio) &&
        (!selectedDivision || String(materia.division || "").toUpperCase() === selectedDivision) &&
        (!query ||
          materia.nombre.toLowerCase().includes(query) ||
          String(materia.profesor?.nombre || "").toLowerCase().includes(query)),
    );
  }, [allMaterias, hasActiveFilters, selectedAnio, selectedDivision, searchTerm]);

  const materiaActiva = useMemo(
    () => filteredMaterias.find((materia) => materia.claseId === selectedMateriaId) || null,
    [filteredMaterias, selectedMateriaId],
  );

  const materiasBoletin = useMemo(() => {
    if (!materiaActiva) return [];
    return allMaterias
      .filter(
        (materia) =>
          String(materia.anio) === String(materiaActiva.anio) &&
          String(materia.division || "").toUpperCase() ===
            String(materiaActiva.division || "").toUpperCase(),
      )
      .map((materia) => ({ _id: materia._id, nombre: materia.nombre }));
  }, [allMaterias, materiaActiva]);

  const limpiarFiltros = () => {
    setSelectedAnio("");
    setSelectedDivision("");
    setSearchTerm("");
    setSelectedMateriaId("");
    setAllMaterias([]);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <GraduationCap size={14} /> Gestión Académica
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Notas y auditoría</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Supervisa calificaciones por materia, exporta boletines y revisa el historial de cambios manuales.
          </p>
        </div>

        <nav
          aria-label="Secciones de notas"
          className="inline-flex rounded-2xl border border-slate-200 bg-canvas p-1"
        >
          <button
            type="button"
            onClick={() => changeTab("planilla")}
            aria-current={activeTab === "planilla" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "planilla"
                ? "bg-white text-secondary shadow-sm"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            <FileEdit size={16} />
            Planilla de notas
          </button>
          <button
            type="button"
            onClick={() => changeTab("auditoria")}
            aria-current={activeTab === "auditoria" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "auditoria"
                ? "bg-white text-secondary shadow-sm"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            <FileClock size={16} />
            Auditoría
          </button>
        </nav>
      </header>

      <CycleStatusNotice cycle={selectedCycle} />

      {activeTab === "auditoria" ? (
        <AdminAuditoriaNotas />
      ) : (
        <div className="space-y-6">
          {/* Filtros de consulta */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FilterChips
                  label="Filtrar materias por año"
                  options={yearOptions}
                  value={selectedAnio}
                  onChange={(anio) => {
                    setSelectedAnio(anio);
                    setSelectedMateriaId("");
                  }}
                />
                {hasActiveFilters && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">
                      {loadingMaterias
                        ? "Buscando..."
                        : `${filteredMaterias.length} materia${filteredMaterias.length === 1 ? "" : "s"} encontrada${filteredMaterias.length === 1 ? "" : "s"}`}
                    </span>
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-canvas hover:text-navy"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setSelectedMateriaId("");
                    }}
                    placeholder="Buscar por materia o docente..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <select
                  value={selectedDivision}
                  onChange={(event) => {
                    setSelectedDivision(event.target.value);
                    setSelectedMateriaId("");
                  }}
                  aria-label="Filtrar por división"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Todas las divisiones</option>
                  {divisionesDisponibles.map((division) => (
                    <option key={division} value={division}>
                      División {division}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMateriaId}
                  onChange={(event) => setSelectedMateriaId(event.target.value)}
                  disabled={!hasActiveFilters || loadingMaterias || filteredMaterias.length === 0}
                  aria-label="Seleccionar materia"
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {!hasActiveFilters
                      ? "Aplica un filtro para elegir materia"
                      : `Seleccionar materia (${filteredMaterias.length})`}
                  </option>
                  {filteredMaterias.map((materia) => (
                    <option key={materia.claseId} value={materia.claseId}>
                      {materia.nombre} ({materia.anio}° &quot;{materia.division || "U"}&quot;) —{" "}
                      {materia.profesor?.nombre || "Sin docente"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {!hasActiveFilters ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-secondary">
                <Filter size={26} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-navy">Aplica un filtro para consultar notas</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
                Selecciona un año, una división o busca por materia o docente para ver las planillas de calificaciones.
              </p>
            </div>
          ) : loadingMaterias ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center shadow-sm">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-secondary" />
              <p className="mt-3 text-sm text-slate-500">Cargando materias del ciclo...</p>
            </div>
          ) : materiaActiva ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-canvas px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-navy">{materiaActiva.nombre}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {materiaActiva.anio}° Año · División &quot;{materiaActiva.division || "U"}&quot; · Docente:{" "}
                    {materiaActiva.profesor?.nombre || "Sin asignar"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMateriaId("")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-secondary"
                >
                  <ArrowLeft size={14} />
                  Volver a materias filtradas
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <CargarNotas
                  materiaId={materiaActiva._id}
                  claseId={materiaActiva.claseId}
                  materiaNombre={materiaActiva.nombre}
                  anio={materiaActiva.anio}
                  division={materiaActiva.division}
                  profesorNombre={materiaActiva.profesor?.nombre}
                  turno={materiaActiva.turno}
                  horaInicio={materiaActiva.horaInicio}
                  horaFin={materiaActiva.horaFin}
                  cicloAnio={selectedCycle?.anio}
                  cicloLectivoId={cycleId}
                  cicloEstado={selectedCycle?.estado}
                  allowBoletinExport
                  materiasBoletin={materiasBoletin}
                  readOnly={
                    selectedCycle?.estado === "CERRADO" || selectedCycle?.estado === "PLANIFICADO"
                  }
                />
              </div>
            </section>
          ) : filteredMaterias.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <BookOpen size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-navy">No hay materias con esos filtros</p>
              <p className="mt-1 text-sm text-slate-500">
                Prueba con otro año, división o término de búsqueda.
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMaterias.map((materia) => (
                <button
                  key={materia.claseId}
                  type="button"
                  onClick={() => setSelectedMateriaId(materia.claseId)}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-secondary">
                      {materia.anio}° &quot;{materia.division || "U"}&quot;
                    </span>
                    <span className="text-xs font-semibold text-secondary opacity-80 group-hover:opacity-100">
                      Abrir planilla →
                    </span>
                  </div>
                  <h3 className="mt-3 truncate text-base font-bold text-navy group-hover:text-secondary">
                    {materia.nombre}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <User size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{materia.profesor?.nombre || "Sin docente asignado"}</span>
                  </p>
                </button>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGestionNotas;
