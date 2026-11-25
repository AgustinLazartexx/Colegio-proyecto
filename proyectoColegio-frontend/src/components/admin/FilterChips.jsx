const FilterChips = ({ label, options, value, onChange, className = "" }) => (
  <div className={className} role="group" aria-label={label}>
    {label && <span className="sr-only">{label}</span>}
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
            value === option.value
              ? "border-blue-100 bg-blue-50 text-secondary"
              : "border-transparent bg-canvas text-slate-600 hover:border-slate-200 hover:bg-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

export default FilterChips;
