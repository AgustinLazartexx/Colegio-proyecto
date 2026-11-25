import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const variants = {
  success: { icon: CheckCircle2, style: "border-emerald-200 bg-emerald-50 text-emerald-900", role: "status" },
  error: { icon: AlertCircle, style: "border-red-200 bg-red-50 text-red-900", role: "alert" },
  info: { icon: Info, style: "border-blue-200 bg-blue-50 text-blue-900", role: "status" },
};

const Toast = ({ id, message, type = "info", onClose, duration = 4000 }) => {
  const variant = variants[type] || variants.info;
  const Icon = variant.icon;

  useEffect(() => {
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, id, onClose]);

  return (
    <div
      role={variant.role}
      className={`flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg ${variant.style}`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button type="button" onClick={onClose} aria-label="Cerrar notificación" className="rounded-md p-0.5 opacity-70 transition hover:bg-black/5 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
