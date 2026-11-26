import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpenCheck, Filter, Loader2, Search } from "lucide-react";
import { getAdminStats } from "../../api/api";
import FilterChips from "../../components/admin/FilterChips";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";

const yearOptions = [
  { value: "", label: "Todos los años" },
  ...["1", "2", "3", "4", "5", "6"].map((anio) => ({ value: anio, label: `${anio}°` })),
];

const defaultDivisions = ["A", "B", "C", "D"];

const AlumnosRiesgoAdmin = () => {
  const { cycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [students, setStudents] = useState([]);
  const [loadedCycleId, setLoadedCycleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedAnio, setSelectedAnio] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const hasActiveFilters = Boolean(selectedAnio || selectedDivision || searchTerm.trim());

  // Reset cached data when academic cycle changes
  useEffect(() => {
    setStudents([]);
    setLoadedCycleId("");
    setError("");
  }, [cycleId]);

  // Solo consulta al servidor cuando el usuario aplica al menos un filtro
  useEffect(() => {
    if (loadingCycles) return;
    if (!cycleId || !hasActiveFilters) {
      setLoading(false);
      return;
    }
    if (loadedCycleId === cycleId) return;

    let active = true;
    const loadRisk = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getAdminStats(cycleId);
        if (active) {
          setStudents(data.alumnosEnRiesgoDetalle || []);
          setLoadedCycleId(cycleId);
        }
      } catch (requestError) {
        if (!active) return;
        console.error("Error cargando alumnos en riesgo académico:", requestError);
        setError(requestError.response?.data?.msg || "No se pudo cargar el seguimiento académico.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRisk();
    return () => {
      active = false;
    };
  }, [cycleId, loadingCycles, hasActiveFilters, loadedCycleId]);

  const divisionesDisponibles = useMemo(() => {
    const found = new Set(defaultDivisions);
    students.forEach((student) => {
      if (student.division) found.add(String(student.division).toUpperCase());
    });
    return [...found].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!hasActiveFilters) return [];
    const query = searchTerm.trim().toLocaleLowerCase("es-AR");
    return students.filter((student) => {
      const matchAnio = !selectedAnio || String(student.nivel) === selectedAnio;
      const matchDivision =
        !selectedDivision || String(student.division || "").toUpperCase() === selectedDivision;
      const matchSearch =
        !query ||
        [student.nombre, student.dni, ...(student.materias || []).map((subject) => subject.nombre)]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase("es-AR").includes(query));
      return matchAnio && matchDivision && matchSearch;
    });
  }, [students, hasActiveFilters, selectedAnio, selectedDivision, searchTerm]);

  const limpiarFiltros = () => {
    setSelectedAnio("");
    setSelectedDivision("");
    setSearchTerm("");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-warm p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
          <AlertTriangle size={14} /> Seguimiento académico
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Alumnos en riesgo académico</h1>
        <p className="mt-2 text-sm text-slate-600">
          Materias con tres trimestres cargados y promedio anual menor a 6 en{" "}
          {selectedCycle?.nombre || "el ciclo seleccionado"}.
        </p>
      </header>

      {/* Barra de filtros */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips
              label="Filtrar alumnos en riesgo por año"
              options={yearOptions}
              value={selectedAnio}
              onChange={setSelectedAnio}
            />
            {hasActiveFilters && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500">
                  {loading
                    ? "Buscando..."
                    : `${filteredStudents.length} alumno${filteredStudents.length === 1 ? "" : "s"} encontrado${filteredStudents.length === 1 ? "" : "s"}`}
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por alumno, DNI o materia..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <select
              value={selectedDivision}
              onChange={(event) => setSelectedDivision(event.target.value)}
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
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!cycleId && !loadingCycles ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-sm">
          <AlertTriangle size={30} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-800">No hay un ciclo seleccionado</p>
          <p className="mt-1 text-sm text-slate-500">Selecciona o crea un ciclo lectivo para consultar el seguimiento.</p>
        </section>
      ) : !hasActiveFilters ? (
        <section className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Filter size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-navy">Aplica un filtro para consultar alumnos en riesgo</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
            Selecciona un año, una división o busca por alumno, DNI o materia para ver el detalle de materias en riesgo.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-5" aria-label="Cargando seguimiento académico">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-50" />
              ))}
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Calculando materias en riesgo
              </div>
            </div>
          ) : error ? null : filteredStudents.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <BookOpenCheck size={32} className="mx-auto text-emerald-500" />
              <p className="mt-3 font-semibold text-slate-800">No hay alumnos en riesgo con esos filtros</p>
              <p className="mt-1 text-sm text-slate-500">
                Prueba con otro año, división o término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <article
                  key={student.alumnoId}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">{student.nombre}</h2>
                      <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {student.nivel}° &quot;{student.division}&quot;
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">DNI: {student.dni || "N/D"}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {student.materias.map((subject) => (
                        <li
                          key={subject.materiaId}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                        >
                          <span className="font-semibold">{subject.nombre}</span>
                          <span className="ml-2">
                            Promedio{" "}
                            {Number(subject.puntajeFinal).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /10
                          </span>
                          {subject.estado === "DESAPROBADA" && (
                            <span className="ml-2 font-semibold">· Recuperación insuficiente</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to="/admin/GestionNotas"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-blue-100"
                  >
                    Abrir gestión de notas
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AlumnosRiesgoAdmin;
