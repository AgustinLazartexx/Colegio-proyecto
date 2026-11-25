import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const SlideOverDrawer = ({ title, description, onClose, children, width = "max-w-xl" }) => {
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Cerrar panel de detalle"
        className="absolute inset-0 bg-navy/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
        className={`relative flex h-full w-full ${width} animate-in slide-in-from-right flex-col bg-white shadow-2xl duration-300`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <h2 id="admin-drawer-title" className="truncate text-xl font-bold text-navy">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-canvas hover:text-navy focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <X size={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
};

export default SlideOverDrawer;
