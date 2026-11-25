const Skeleton = ({ className = "h-4 w-full", rounded = "rounded-lg" }) => (
  <span aria-hidden="true" className={`block animate-pulse bg-slate-100 ${rounded} ${className}`} />
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3 p-5" aria-label="Cargando resultados" role="status">
    {Array.from({ length: rows }, (_, row) => (
      <div key={row} className="grid gap-3 rounded-xl border border-slate-100 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, column) => (
          <Skeleton key={column} className={`h-4 ${column === 0 ? "w-3/4" : "w-full"}`} />
        ))}
      </div>
    ))}
    <span className="sr-only">Cargando resultados</span>
  </div>
);

export default Skeleton;
