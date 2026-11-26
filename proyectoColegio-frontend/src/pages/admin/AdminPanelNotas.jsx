import { useEffect, useMemo, useState } from "react";
import { getAuditoriaNotas } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  GraduationCap,
  History,
  Loader2,
  Search,
  User,
} from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFieldName = (field) => {
  const map = {
    orientadora: "Nota Orientadora",
    proceso: "Nota de Proceso",
    integradora: "Nota Integradora",
    recuperacion: "Recuperatorio",
  };
  return map[field] || field;
};

const AdminAuditoriaNotas = () => {
  const { token } = useAuth();
  const { cycleId, loadingCycles } = useAcademicCycles();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loadingCycles) return;
    if (!cycleId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    const fetchAuditoria = async () => {
      setLoading(true);
      try {
        const res = await getAuditoriaNotas(cycleId);
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.msg || "Error al cargar el historial de cambios.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditoria();
  }, [token, cycleId, loadingCycles]);

  const visibleLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [
        log.alumno?.nombre,
        log.modificadoPor?.nombre,
        log.materia?.nombre,
        formatFieldName(log.campoModificado),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [logs, search]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-amber-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-800">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Auditoría de cambios en notas</h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-800">
              <AlertTriangle size={12} />
              Monitoreo de modificaciones manuales ({logs.length} registro{logs.length === 1 ? "" : "s"})
            </p>
          </div>
        </div>

        <label className="relative block w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar por alumno, materia o usuario..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </label>
      </div>

      <div className="space-y-3 bg-canvas/50 p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            <p className="text-sm font-medium text-slate-500">Consultando registros de auditoría...</p>
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-slate-400">
            <div className="mb-3 rounded-full bg-white p-4 shadow-sm">
              <History size={28} />
            </div>
            <p className="font-semibold text-navy">
              {search ? "No hay cambios que coincidan con esa búsqueda" : "No se han registrado modificaciones manuales"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Las ediciones administrativas sobre calificaciones aparecerán aquí.
            </p>
          </div>
        ) : (
          visibleLogs.map((log) => (
            <div
              key={log._id}
              className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-amber-200 sm:p-5"
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-amber-400" />

              <div className="flex flex-col items-start justify-between gap-4 pl-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      <User size={11} /> ADMIN
                    </span>
                    <span className="text-sm font-semibold text-navy">
                      {log.modificadoPor?.nombre || "Usuario desconocido"}
                    </span>
                    <span className="text-xs text-slate-400">modificó a</span>
                  </div>

                  <h3 className="flex items-center gap-2 text-base font-bold text-navy">
                    <GraduationCap size={18} className="shrink-0 text-secondary" />
                    <span className="truncate">{log.alumno?.nombre || "Alumno eliminado"}</span>
                  </h3>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-secondary">
                      {log.trimestre}° Trimestre
                    </span>
                    {log.materia?.nombre && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-slate-700">{log.materia.nombre}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="capitalize">{formatFieldName(log.campoModificado)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-canvas px-3 py-2">
                    <div className="text-center">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Antes</span>
                      <span className="font-mono text-base font-bold text-red-500 line-through opacity-80">
                        {log.valorAnterior ?? "-"}
                      </span>
                    </div>
                    <ArrowRight className="text-slate-300" size={18} />
                    <div className="text-center">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Ahora</span>
                      <span className="font-mono text-lg font-bold text-emerald-600">
                        {log.valorNuevo ?? "-"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                    <CalendarClock size={12} />
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAuditoriaNotas;
