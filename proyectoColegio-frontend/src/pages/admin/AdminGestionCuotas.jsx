import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import {
  generarCuota,
  getCuotasDeAlumno,
  marcarCuotaVencida,
  registrarPagoCuota,
} from "../../api/api";
import { CycleStatusNotice } from "../../components/admin/CycleSelector";
import SlideOverDrawer from "../../components/admin/SlideOverDrawer";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const formatDate = (value) => {
  if (!value) return "—";
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("es-AR");
};

const AdminGestionCuotas = ({ alumno, onClose }) => {
  const { cycleId, selectedCycle } = useAcademicCycles();
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [nuevaCuota, setNuevaCuota] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    monto: "",
    fechaVencimiento: "",
  });

  const canEdit = ["ACTIVO", "RECUPERACION"].includes(selectedCycle?.estado);

  const cargarCuotas = useCallback(async () => {
    if (!cycleId || !alumno?._id) {
      setCuotas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getCuotasDeAlumno(alumno._id, { cicloLectivoId: cycleId });
      setCuotas(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Error al cargar historial de cuotas");
    } finally {
      setLoading(false);
    }
  }, [alumno?._id, cycleId]);

  useEffect(() => {
    cargarCuotas();
  }, [cargarCuotas]);

  const resumen = useMemo(() => {
    return cuotas.reduce(
      (acc, cuota) => {
        const key = cuota.estado || "pendiente";
        if (Object.hasOwn(acc, key)) acc[key] += 1;
        return acc;
      },
      { pendiente: 0, vencido: 0, pagado: 0 },
    );
  }, [cuotas]);

  const handleGenerar = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    if (!nuevaCuota.monto || !nuevaCuota.fechaVencimiento) {
      toast.warning("Complete monto y vencimiento");
      return;
    }

    setSubmitting(true);
    try {
      await generarCuota({ ...nuevaCuota, alumnoId: alumno._id, cicloLectivoId: cycleId });
      toast.success("Cuota generada correctamente");
      setNuevaCuota((current) => ({ ...current, monto: "", fechaVencimiento: "" }));
      cargarCuotas();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Error al generar cuota");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePagar = async (cuotaId) => {
    if (!canEdit) return;
    if (!window.confirm("¿Confirmar recepción del pago?")) return;
    try {
      const res = await registrarPagoCuota(cuotaId, "efectivo");
      toast.success(res.data.msg);
      cargarCuotas();
    } catch {
      toast.error("Error al registrar pago");
    }
  };

  const handleVencer = async (cuotaId) => {
    if (!canEdit) return;
    try {
      await marcarCuotaVencida(cuotaId);
      toast.info("Cuota marcada como vencida");
      cargarCuotas();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  return (
    <SlideOverDrawer
      title={`Cuotas · ${alumno?.nombre || "Alumno"}`}
      description={
        selectedCycle
          ? `${selectedCycle.nombre} · ${selectedCycle.estado}`
          : "Gestión financiera del alumno"
      }
      onClose={onClose}
      width="max-w-2xl"
    >
      <div className="space-y-6 p-5 sm:p-7">
        <CycleStatusNotice cycle={selectedCycle} />

        {/* Resumen rápido del alumno */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Vencidas</p>
            <p className="mt-1 text-2xl font-bold text-red-800">{loading ? "—" : resumen.vencido}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Pendientes</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{loading ? "—" : resumen.pendiente}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Pagadas</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">{loading ? "—" : resumen.pagado}</p>
          </div>
        </div>

        {/* Formulario inline para generar cuota */}
        <section className="rounded-2xl border border-slate-200/80 bg-canvas p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
            <Plus size={16} className="text-secondary" />
            Generar nueva cuota
          </h3>
          <form onSubmit={handleGenerar} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Mes</label>
              <input
                type="number"
                min="1"
                max="12"
                value={nuevaCuota.mes}
                onChange={(event) => setNuevaCuota({ ...nuevaCuota, mes: event.target.value })}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Año</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={nuevaCuota.anio}
                onChange={(event) => setNuevaCuota({ ...nuevaCuota, anio: event.target.value })}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Monto ($)</label>
              <input
                type="number"
                value={nuevaCuota.monto}
                onChange={(event) => setNuevaCuota({ ...nuevaCuota, monto: event.target.value })}
                disabled={!canEdit}
                placeholder="Ej: 15000"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Vencimiento</label>
              <input
                type="date"
                value={nuevaCuota.fechaVencimiento}
                onChange={(event) =>
                  setNuevaCuota({ ...nuevaCuota, fechaVencimiento: event.target.value })
                }
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
              />
            </div>
            <div className="col-span-2 sm:col-span-4 flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canEdit || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Generar cuota
              </button>
            </div>
          </form>
        </section>

        {/* Historial de pagos */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          <div className="border-b border-slate-100 bg-canvas px-4 py-3">
            <h3 className="text-sm font-bold text-navy">Historial de cuotas ({cuotas.length})</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin text-secondary" />
              Cargando historial...
            </div>
          ) : cuotas.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No hay cuotas registradas para este ciclo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-canvas/60 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Vencimiento</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuotas.map((cuota) => (
                    <tr key={cuota._id} className="transition hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-semibold text-navy">
                        {cuota.mes}/{cuota.anio}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {currency.format(Number(cuota.monto || 0))}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(cuota.fechaVencimiento)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                            cuota.estado === "pagado"
                              ? "bg-emerald-50 text-emerald-700"
                              : cuota.estado === "vencido"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {cuota.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {cuota.estado !== "pagado" ? (
                            <button
                              type="button"
                              onClick={() => handlePagar(cuota._id)}
                              disabled={!canEdit}
                              title="Registrar pago"
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Cobrar
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                              <CheckCircle2 size={14} /> Pagada
                            </span>
                          )}
                          {cuota.estado === "pendiente" && (
                            <button
                              type="button"
                              onClick={() => handleVencer(cuota._id)}
                              disabled={!canEdit}
                              title="Marcar como vencida"
                              aria-label="Marcar cuota como vencida"
                              className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <AlertCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SlideOverDrawer>
  );
};

export default AdminGestionCuotas;
