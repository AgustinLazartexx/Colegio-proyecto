import { createElement, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Search,
  Wallet,
} from "lucide-react";
import { getCuotasAdministracion } from "../../api/api";
import DataTable from "../../components/admin/DataTable";
import FilterChips from "../../components/admin/FilterChips";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import AdminGestionCuotas from "./AdminGestionCuotas";

const filters = [
  { value: "vencido", label: "Vencidas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagadas" },
  { value: "todos", label: "Todas" },
];

const kpiMeta = [
  {
    key: "vencido",
    label: "Vencidas",
    icon: AlertTriangle,
    accent: "text-red-700 bg-red-50 border-red-200",
    ring: "ring-red-200 border-red-300",
  },
  {
    key: "pendiente",
    label: "Pendientes",
    icon: Clock,
    accent: "text-amber-800 bg-amber-50 border-amber-200",
    ring: "ring-amber-200 border-amber-300",
  },
  {
    key: "pagado",
    label: "Pagadas",
    icon: CheckCircle2,
    accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    ring: "ring-emerald-200 border-emerald-300",
  },
  {
    key: "todos",
    label: "Total ciclo",
    icon: CircleDollarSign,
    accent: "text-secondary bg-blue-50 border-blue-200",
    ring: "ring-blue-200 border-blue-300",
  },
];

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

const emptyBuckets = { vencido: [], pendiente: [], pagado: [], todos: [] };

const CuotasResumenAdmin = () => {
  const { cycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get("estado");
  const status = filters.some((filter) => filter.value === requestedStatus)
    ? requestedStatus
    : "vencido";

  const [buckets, setBuckets] = useState(emptyBuckets);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadFees = async () => {
      if (!cycleId) {
        setBuckets(emptyBuckets);
        setLoading(loadingCycles);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const statuses = ["vencido", "pendiente", "pagado", "todos"];
        const responses = await Promise.all(
          statuses.map((estado) => getCuotasAdministracion({ cicloLectivoId: cycleId, estado })),
        );
        if (!active) return;
        const nextBuckets = {};
        statuses.forEach((estado, index) => {
          const data = responses[index]?.data;
          nextBuckets[estado] = Array.isArray(data) ? data : [];
        });
        setBuckets(nextBuckets);
      } catch (requestError) {
        if (!active) return;
        console.error("Error cargando el resumen de cuotas:", requestError);
        setError(requestError.response?.data?.msg || "No se pudo cargar el resumen de cuotas.");
        setBuckets(emptyBuckets);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFees();
    return () => {
      active = false;
    };
  }, [cycleId, loadingCycles, refreshKey]);

  const rows = useMemo(() => buckets[status] || [], [buckets, status]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-AR");
    if (!query) return rows;
    return rows.filter((row) =>
      [row.nombre, row.dni, row.nivel, row.division].some((value) =>
        String(value ?? "").toLocaleLowerCase("es-AR").includes(query),
      ),
    );
  }, [rows, search]);

  const kpiCards = useMemo(() => {
    return kpiMeta.map((meta) => {
      const list = buckets[meta.key] || [];
      const amount = list.reduce((sum, row) => sum + Number(row.montoTotal || 0), 0);
      const cuotasCount = list.reduce((sum, row) => sum + Number(row.cantidadCuotas || 0), 0);
      return {
        ...meta,
        alumnos: list.length,
        cuotasCount,
        amount,
      };
    });
  }, [buckets]);

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

  const columns = [
    {
      key: "alumno",
      label: "Alumno",
      render: (row) => (
        <button type="button" onClick={() => openStudentFees(row)} className="text-left group">
          <p className="font-semibold text-navy transition-colors group-hover:text-secondary">
            {row.nombre}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">DNI: {row.dni || "N/D"}</p>
        </button>
      ),
    },
    {
      key: "curso",
      label: "Curso",
      render: (row) =>
        row.nivel ? (
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
            {row.nivel}° &quot;{row.division || "—"}&quot;
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "cuotas",
      label: "Cuotas",
      render: (row) => (
        <span className="font-medium text-slate-700">{row.cantidadCuotas}</span>
      ),
    },
    {
      key: "monto",
      label: "Monto total",
      render: (row) => (
        <span className="font-bold text-navy">{currency.format(row.montoTotal)}</span>
      ),
    },
    {
      key: "vencimiento",
      label: "Vencimiento más antiguo",
      render: (row) => formatDate(row.vencimientoMasAntiguo),
    },
    {
      key: "acciones",
      label: "Gestión",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <button
          type="button"
          onClick={() => openStudentFees(row)}
          className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary hover:text-white"
        >
          Gestionar cuotas
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <Wallet size={14} /> Administración
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Cuotas del ciclo</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {selectedCycle
              ? `${selectedCycle.nombre} · ${selectedCycle.estado} — Haz clic en un indicador o alumno para cobrar y generar cuotas.`
              : "Selecciona un ciclo lectivo desde la barra superior."}
          </p>
        </div>
      </header>

      {selectedCycle?.estado === "CERRADO" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
        >
          <CheckCircle2 size={18} />
          Ciclo cerrado: el historial se consulta en modo solo lectura.
        </div>
      )}

      {/* Tarjetas KPI arriba (accionables para filtrar la tabla abajo) */}
      <section aria-label="Resumen financiero por estado" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const isSelected = status === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => changeStatus(card.key)}
              aria-pressed={isSelected}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                isSelected ? `ring-2 ${card.ring}` : "border-slate-200/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-navy">
                    {loading ? "—" : currency.format(card.amount)}
                  </p>
                </div>
                <span className={`rounded-xl border p-2.5 ${card.accent}`}>
                  {createElement(card.icon, { size: 18 })}
                </span>
              </div>
              <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-500">
                {loading
                  ? "Calculando..."
                  : `${card.alumnos} alumno${card.alumnos === 1 ? "" : "s"} · ${card.cuotasCount} cuota${card.cuotasCount === 1 ? "" : "s"}`}
              </p>
            </button>
          );
        })}
      </section>

      {/* Tabla de gestión integrada abajo */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <FilterChips
            label="Filtrar cuotas por estado"
            options={filters}
            value={status}
            onChange={changeStatus}
          />
          <label className="relative block w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar alumno, DNI o curso..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="m-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle size={17} /> {error}
          </div>
        )}

        {!cycleId && !loadingCycles ? (
          <div className="px-6 py-14 text-center">
            <CalendarDays size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-navy">No hay ciclos lectivos disponibles</p>
            <p className="mt-1 text-sm text-slate-500">Crea un ciclo para consultar y gestionar sus cuotas.</p>
          </div>
        ) : !error ? (
          <DataTable
            rows={visibleRows}
            columns={columns}
            getRowId={(row) => row.alumnoId}
            loading={loading}
            emptyState={
              <div className="mx-auto max-w-sm">
                <CircleDollarSign size={34} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-navy">No hay cuotas para mostrar</p>
                <p className="mt-1 text-sm text-slate-500">
                  {search
                    ? "Prueba con otro nombre o DNI."
                    : "No se encontraron cuotas con este estado en el ciclo seleccionado."}
                </p>
              </div>
            }
          />
        ) : null}
      </section>

      {selectedStudent && <AdminGestionCuotas alumno={selectedStudent} onClose={closeStudentFees} />}
    </div>
  );
};

export default CuotasResumenAdmin;
