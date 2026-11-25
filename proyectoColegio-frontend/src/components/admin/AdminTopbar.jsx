import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  Search,
  Users,
  X,
} from "lucide-react";
import { getTodasLasClases, getUsuarios } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";

const cycleStatusStyles = {
  ACTIVO: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RECUPERACION: "border-amber-200 bg-amber-50 text-amber-800",
  CERRADO: "border-slate-200 bg-slate-100 text-slate-600",
  PLANIFICADO: "border-blue-100 bg-blue-50 text-secondary",
};

const responseItems = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.clases)) return data.clases;
  return [];
};

const classSearchText = (clase) => {
  const level = clase.nivel ?? clase.anio;
  return [
  clase.materia?.nombre,
  clase.materiaNombre,
  level,
  level === undefined ? "" : `${level}°`,
  clase.division,
  clase.diaSemana,
  clase.horaInicio,
  ].filter(Boolean).join(" ").toLocaleLowerCase();
};

const AdminTopbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { cycles, cycleId, setCycleId, selectedCycle, loadingCycles } = useAcademicCycles();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchInputRef = useRef(null);

  const statusClass = cycleStatusStyles[selectedCycle?.estado] || cycleStatusStyles.PLANIFICADO;
  const initials = useMemo(
    () => (usuario?.nombre || "Admin").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
    [usuario?.nombre],
  );
  const userResults = users.flat().slice(0, 6);
  const classResults = classes.slice(0, 6);
  const hasResults = userResults.length > 0 || classResults.length > 0;

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
    else {
      setQuery("");
      setUsers([]);
      setClasses([]);
      setSearchError("");
    }
  }, [searchOpen]);

  useEffect(() => {
    const searchTerm = query.trim();
    if (!searchOpen || searchTerm.length < 2) {
      setUsers([]);
      setClasses([]);
      setSearchError("");
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const roleRequests = ["alumno", "profesor", "admin"].map((rol) =>
          getUsuarios({ rol, q: searchTerm }).then((response) => response.data || []),
        );
        const classRequest = cycleId
          ? getTodasLasClases({ cicloLectivoId: cycleId })
          : Promise.resolve({ data: [] });
        const [roleResults, classResponse] = await Promise.all([
          Promise.all(roleRequests),
          classRequest,
        ]);

        if (cancelled) return;
        const normalizedTerm = searchTerm.toLocaleLowerCase();
        setUsers(roleResults);
        setClasses(responseItems(classResponse).filter((clase) => classSearchText(clase).includes(normalizedTerm)));
      } catch (error) {
        if (cancelled) return;
        console.error("No se pudo completar la búsqueda administrativa:", error);
        setSearchError(error.response?.data?.msg || "No se pudo completar la búsqueda. Intenta nuevamente.");
        setUsers([]);
        setClasses([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [cycleId, query, searchOpen]);

  const closeSearch = () => setSearchOpen(false);

  const goToUser = (user) => {
    const params = new URLSearchParams({
      q: user.dni || user.nombre,
      rol: user.rol,
      id: user._id || user.id,
    });
    navigate(`/admin/usuarios?${params.toString()}`);
    closeSearch();
  };

  const goToClass = (clase) => {
    navigate(`/admin/clases/${clase._id || clase.id}/gestionar`);
    closeSearch();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur">
        <div className="flex min-h-[4.5rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Abrir menú de administración"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-navy transition hover:bg-blue-50 hover:text-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 md:hidden"
          >
            <Menu size={19} aria-hidden="true" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Administración</p>
            <p className="truncate text-sm font-bold text-navy">Colegio Reina de la Esperanza</p>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:min-w-[13rem] sm:justify-start"
              aria-label="Buscar alumnos, profesores o clases. Atajo Control K"
            >
              <Search size={17} aria-hidden="true" />
              <span className="hidden truncate text-sm sm:inline">Buscar personas o clases</span>
              <kbd className="ml-auto hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-flex">
                Ctrl K
              </kbd>
            </button>

            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <label className="sr-only" htmlFor="global-academic-cycle">Ciclo lectivo actual</label>
              <select
                id="global-academic-cycle"
                value={cycleId}
                onChange={(event) => setCycleId(event.target.value)}
                disabled={loadingCycles || cycles.length === 0}
                className="w-20 min-w-0 rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-1 text-xs font-semibold text-navy shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 sm:w-auto sm:max-w-[15rem] sm:py-2 sm:pl-3 sm:pr-8 sm:text-sm"
              >
                {cycles.length === 0 ? (
                  <option value="">Sin ciclos</option>
                ) : (
                  cycles.map((cycle) => (
                    <option key={cycle._id} value={cycle._id}>{cycle.nombre}</option>
                  ))
                )}
              </select>
              {selectedCycle && (
                <span
                  aria-label={`Estado del ciclo: ${selectedCycle.estado}`}
                  title={selectedCycle.estado}
                  className={`inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border px-0 text-[0px] font-bold tracking-wide sm:h-auto sm:w-auto sm:px-2.5 sm:py-1 sm:text-[10px] ${statusClass}`}
                >
                  {selectedCycle.estado}
                </span>
              )}
            </div>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-secondary">
                {initials}
              </div>
              <div className="hidden min-w-0 xl:block">
                <p className="max-w-36 truncate text-sm font-semibold text-navy">{usuario?.nombre || "Administrador"}</p>
                <p className="text-xs text-slate-500">Administrador</p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
              >
                <LogOut size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {selectedCycle?.estado === "CERRADO" && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 sm:px-6 lg:px-8" role="status">
            Modo Solo Lectura: consultando historial del ciclo {selectedCycle.anio}.
          </div>
        )}
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 px-4 py-[10vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSearch();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-quick-search-title"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-slate-900/20"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
              <Search className="shrink-0 text-secondary" size={20} aria-hidden="true" />
              <h2 id="admin-quick-search-title" className="sr-only">Búsqueda rápida</h2>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, DNI, materia o curso..."
                className="min-w-0 flex-1 border-0 bg-transparent text-base text-navy outline-none placeholder:text-slate-400 focus:ring-0"
                aria-label="Buscar alumnos, profesores o clases"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Cerrar búsqueda"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4">
              {query.trim().length < 2 ? (
                <div className="rounded-xl bg-canvas px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-navy">Búsqueda rápida</p>
                  <p className="mt-1 text-sm text-slate-500">Escribe al menos 2 caracteres para buscar personas o clases.</p>
                </div>
              ) : searching ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm font-medium text-slate-500" role="status">
                  <Loader2 className="animate-spin text-secondary" size={18} aria-hidden="true" />
                  Buscando coincidencias...
                </div>
              ) : searchError ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{searchError}</p>
              ) : !hasResults ? (
                <div className="rounded-xl bg-canvas px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-navy">No encontramos coincidencias</p>
                  <p className="mt-1 text-sm text-slate-500">Revisa el nombre, DNI, materia o curso e intenta otra vez.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userResults.length > 0 && (
                    <div>
                      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Personas</p>
                      <div className="space-y-1">
                        {userResults.map((user) => (
                          <button
                            type="button"
                            key={`${user.rol}-${user._id || user.id}`}
                            onClick={() => goToUser(user)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-secondary">
                              <Users size={17} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-navy">{user.nombre}</span>
                              <span className="block truncate text-xs capitalize text-slate-500">
                                {user.rol}{user.dni ? ` · DNI ${user.dni}` : ""}
                              </span>
                            </span>
                            <ArrowUpRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {classResults.length > 0 && (
                    <div>
                      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Clases del ciclo seleccionado</p>
                      <div className="space-y-1">
                        {classResults.map((clase) => (
                          <button
                            type="button"
                            key={clase._id || clase.id}
                            onClick={() => goToClass(clase)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-accent">
                              {clase.materia?.nombre ? <BookOpen size={17} aria-hidden="true" /> : <GraduationCap size={17} aria-hidden="true" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-navy">
                                {clase.materia?.nombre || clase.materiaNombre || "Clase"}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {clase.nivel ?? clase.anio}° {clase.division || ""} · {clase.diaSemana || "Horario a definir"} {clase.horaInicio || ""}
                              </span>
                            </span>
                            <ArrowUpRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-canvas px-4 py-2.5 text-[11px] text-slate-500 sm:px-5">
              <span>Busca por nombre, DNI, materia o curso</span>
              <button type="button" onClick={closeSearch} className="font-semibold text-secondary hover:text-[#142f91]">Esc para cerrar</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default AdminTopbar;
