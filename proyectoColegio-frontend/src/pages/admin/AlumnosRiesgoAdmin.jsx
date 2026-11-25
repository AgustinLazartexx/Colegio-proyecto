import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpenCheck, Loader2 } from "lucide-react";
import { getAdminStats } from "../../api/api";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";

const AlumnosRiesgoAdmin = () => {
  const { cycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadRisk = async () => {
      if (!cycleId) {
        setStudents([]);
        setLoading(loadingCycles);
        return;
      }

      setLoading(true);
      setError("");
      setStudents([]);
      try {
        const { data } = await getAdminStats(cycleId);
        if (active) setStudents(data.alumnosEnRiesgoDetalle || []);
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
  }, [cycleId, loadingCycles]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-warm p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
          <AlertTriangle size={14} /> Seguimiento académico
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Alumnos en riesgo académico</h1>
        <p className="mt-2 text-sm text-slate-600">
          Materias con tres trimestres cargados y puntaje final menor a 18 en{" "}
          {selectedCycle?.nombre || "el ciclo seleccionado"}.
        </p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Cargando seguimiento académico">
            {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-50" />)}
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Calculando materias en riesgo
            </div>
          </div>
        ) : !cycleId && !loadingCycles ? (
          <div className="px-6 py-14 text-center">
            <AlertTriangle size={30} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">No hay un ciclo seleccionado</p>
            <p className="mt-1 text-sm text-slate-500">Selecciona o crea un ciclo lectivo para consultar el seguimiento.</p>
          </div>
        ) : error ? null : students.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <BookOpenCheck size={32} className="mx-auto text-emerald-500" />
            <p className="mt-3 font-semibold text-slate-800">No hay alumnos con materias en riesgo</p>
            <p className="mt-1 text-sm text-slate-500">El cálculo se actualiza con las notas trimestrales del ciclo seleccionado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((student) => (
              <article key={student.alumnoId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-slate-900">{student.nombre}</h2>
                    <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {student.nivel}° "{student.division}"
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
                        <span className="ml-2">Puntaje {Number(subject.puntajeFinal).toLocaleString("es-AR")}/30</span>
                        {subject.estado === "DESAPROBADA" && <span className="ml-2 font-semibold">· Recuperación insuficiente</span>}
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
    </div>
  );
};

export default AlumnosRiesgoAdmin;
