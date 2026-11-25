import { useMemo } from "react";
import { SkeletonTable } from "./Skeleton";

const DataTable = ({
  rows = [],
  columns = [],
  getRowId = (row) => row._id,
  loading = false,
  selectedIds = [],
  onSelectionChange,
  emptyState = "No hay registros para mostrar.",
}) => {
  const selectable = typeof onSelectionChange === "function";
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rowIds = rows.map(getRowId);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = rowIds.some((id) => selected.has(id));

  const selectAll = () => {
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !rowIds.includes(id)));
      return;
    }
    onSelectionChange([...new Set([...selectedIds, ...rowIds])]);
  };

  const selectRow = (id) => {
    onSelectionChange(
      selected.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  };

  if (loading) return <SkeletonTable columns={columns.length + Number(selectable)} />;

  if (!rows.length) {
    return (
      <div className="px-6 py-14 text-center" role="status">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-100 bg-canvas text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-4">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos los resultados"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={selectAll}
                  className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-blue-200"
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.key} className={`px-5 py-4 ${column.headerClassName || ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const id = getRowId(row);
            return (
              <tr id={`row-${id}`} key={id} className="transition-colors hover:bg-blue-50/40">
                {selectable && (
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${row.nombre || "registro"}`}
                      checked={selected.has(id)}
                      onChange={() => selectRow(id)}
                      className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-blue-200"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={`px-5 py-4 text-slate-600 ${column.className || ""}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
