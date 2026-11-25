const CycleSelector = ({ cycles, value, onChange, disabled = false, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-sm font-medium text-gray-700">Ciclo lectivo</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || cycles.length === 0}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
    >
      {cycles.length === 0 ? (
        <option value="">No hay ciclos lectivos</option>
      ) : (
        cycles.map((cycle) => (
          <option key={cycle._id} value={cycle._id}>
            {cycle.nombre} · {cycle.estado}
          </option>
        ))
      )}
    </select>
  </label>
);

export const CycleStatusNotice = ({ cycle }) => {
  if (!cycle) return null;
  if (cycle.estado === "CERRADO") {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="status">
        Modo Solo Lectura: este ciclo lectivo está cerrado.
      </div>
    );
  }
  if (cycle.estado === "RECUPERACION") {
    return (
      <div className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-900" role="status">
        Período de recuperación: la edición regular de notas está bloqueada.
      </div>
    );
  }
  if (cycle.estado === "PLANIFICADO") {
    return (
      <div className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900" role="status">
        Ciclo planificado: la gestión académica se habilita al activarlo.
      </div>
    );
  }
  return null;
};

export default CycleSelector;
