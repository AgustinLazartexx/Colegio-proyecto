import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, CalendarDays, CheckCircle2, CircleDollarSign, Loader2, Search, Wallet } from "lucide-react";
import { getCuotasAdministracion } from "../../api/api";
import AdminGestionCuotas from "./AdminGestionCuotas";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";

const filters = [
  { value: "vencido", label: "Vencidas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagadas" },
  { value: "todos", label: "Todas" },
];

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const formatDate = (value) => {
  if (!value) return "—";
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("es-AR");
};

const CuotasResumenAdmin = () => {
  const { cycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get("estado");
  const status = filters.some((filter) => filter.value === requestedStatus) ? requestedStatus : "vencido";
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadFees = async () => {
      if (!cycleId) {
        setRows([]);
        setLoading(loadingCycles);
        return;
      }

      setLoading(true);
      setError("");
      setRows([]);
      try {
        const { data } = await getCuotasAdministracion({ cicloLectivoId: cycleId, estado: status });
        if (active) setRows(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (!active) return;
        console.error("Error cargando el resumen de cuotas:", requestError);
        setError(requestError.response?.data?.msg || "No se pudo cargar el resumen de cuotas.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFees();
    return () => {
      active = false;
    };
  }, [cycleId, loadingCycles, status, refreshKey]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-AR");
    if (!query) return rows;
    return rows.filter((row) =>
      [row.nombre, row.dni, row.nivel, row.division]
        .some((value) => String(value ?? "").toLocaleLowerCase("es-AR").includes(query)),
    );
  }, [rows, search]);

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.montoTotal || 0), 0);

  const changeStatus = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("estado", value);
    setSearchParams(next);
  };

  const openStudentFees = (row) => {
    setSelectedStudent({ _id: row.alumnoId, nombre: row.nombre });
  };

  const closeStudentFees = () => {
    setSelectedStudent(null);
    setRefreshKey((key) => key + 1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <Wallet size={14} /> Administración
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Cuotas del ciclo</h1>
          <p className="mt-2 text-sm text-slate-500">
            {selectedCycle ? `${selectedCycle.nombre} · ${selectedCycle.estado}` : "Selecciona un ciclo lectivo desde la barra superior."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <div className="rounded-2xl bg-canvas p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alumnos en la lista</p>
            <p className="mt-1 text-2xl font-bold text-navy">{loading ? "—" : rows.length}</p>
          </div>
          <div className="rounded-2xl bg-canvas p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monto del filtro</p>
            <p className="mt-1 text-lg font-bold text-navy">{loading ? "—" : currency.format(totalAmount)}</p>
          </div>
        </div>
      </header>

      {selectedCycle?.estado === "CERRADO" && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
          <CheckCircle2 size={18} />
          Ciclo cerrado: el historial se consulta en modo solo lectura.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-wrap gap-2" aria-label="Filtrar cuotas por estado">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => changeStatus(filter.value)}
                aria-pressed={status === filter.value}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  status === filter.value
                    ? "bg-secondary text-white shadow-sm"
                    : "bg-canvas text-slate-600 hover:bg-blue-50 hover:text-secondary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar alumno o DNI"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="m-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={17} /> {error}
          </div>
        )}

        {!cycleId && !loadingCycles ? (
          <div className="px-6 py-14 text-center">
            <CalendarDays size={30} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">No hay ciclos lectivos disponibles</p>
            <p className="mt-1 text-sm text-slate-500">Crea un ciclo para consultar y gestionar sus cuotas.</p>
          </div>
        ) : loading ? (
          <div className="space-y-3 p-5" aria-label="Cargando cuotas">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-50" />)}
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Cargando cuotas del ciclo
            </div>
          </div>
        ) : error ? null : visibleRows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CircleDollarSign size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">No hay cuotas para mostrar</p>
            <p className="mt-1 text-sm text-slate-500">
              {search ? "Prueba con otro nombre o DNI." : "No se encontraron cuotas con este estado en el ciclo seleccionado."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-canvas text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Alumno</th>
                  <th className="px-5 py-4">Curso</th>
                  <th className="px-5 py-4">Cuotas</th>
                  <th className="px-5 py-4">Monto total</th>
                  <th className="px-5 py-4">Vencimiento más antiguo</th>
                  <th className="px-5 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row) => (
                  <tr key={row.alumnoId} className="transition hover:bg-blue-50/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{row.nombre}</p>
                      <p className="mt-0.5 text-xs text-slate-500">DNI: {row.dni || "N/D"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.nivel ? `${row.nivel}° "${row.division || "—"}"` : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{row.cantidadCuotas}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{currency.format(row.montoTotal)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(row.vencimientoMasAntiguo)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openStudentFees(row)}
                        className="rounded-lg px-3 py-2 font-semibold text-secondary transition hover:bg-blue-50"
                      >
                        Gestionar cuotas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedStudent && <AdminGestionCuotas alumno={selectedStudent} onClose={closeStudentFees} />}
    </div>
  );
};

export default CuotasResumenAdmin;
