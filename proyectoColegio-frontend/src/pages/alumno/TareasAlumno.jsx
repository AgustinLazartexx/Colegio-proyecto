import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, { BACKEND_URL, getMisClasesAlumno } from "../../api/api";
import EntregarTarea from "../../components/alumno/EntregarTarea";
import FilterChips from "../../components/admin/FilterChips";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Download,
  FileText,
  Inbox,
  Loader2,
} from "lucide-react";

const TareaItem = ({ tarea, alumnoId, destacada = false }) => {
  const esVencida = new Date(tarea.fechaEntrega) < new Date();

  return (
    <li
      id={`tarea-${tarea._id}`}
      className={`border-t border-slate-100 py-5 first:border-t-0 ${
        destacada ? "rounded-2xl bg-blue-50/40 px-4 ring-1 ring-blue-200" : ""
      }`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-navy">{tarea.titulo}</h3>
            {destacada && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Seleccionada
              </span>
            )}
          </div>
          {tarea.descripcion && (
            <p className="mt-1 text-sm text-slate-600">{tarea.descripcion}</p>
          )}
          <div
            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${
              esVencida ? "text-red-600" : "text-slate-500"
            }`}
          >
            <Calendar size={14} />
            <span>
              Fecha de entrega:{" "}
              {tarea.fechaEntrega
                ? new Date(tarea.fechaEntrega).toLocaleDateString("es-AR")
                : "Sin fecha"}
            </span>
          </div>
        </div>
        {tarea.archivo && (
          <a
            href={`${BACKEND_URL}/uploads/${tarea.archivo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-blue-100"
          >
            <Download size={14} />
            Descargar archivo
          </a>
        )}
      </div>
      <EntregarTarea tareaId={tarea._id} alumnoId={alumnoId} />
    </li>
  );
};

const TareasAlumno = () => {
  const { usuario, authCargando } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetTareaId = searchParams.get("tareaId") || "";
  const selectedMateriaParam = searchParams.get("materiaId") || "";

  const [tareasPorMateria, setTareasPorMateria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const alumnoId = usuario?._id || usuario?.id || "";

  const fetchTareas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resClases = await getMisClasesAlumno();
      const materiasMap = new Map();
      const clases = Array.isArray(resClases.data) ? resClases.data : resClases.data?.clases || [];
      for (const clase of clases) {
        if (clase.materia?._id && !materiasMap.has(clase.materia._id)) {
          materiasMap.set(clase.materia._id, clase.materia);
        }
      }
      const materiasAlumno = [...materiasMap.values()];

      if (materiasAlumno.length === 0) {
        setTareasPorMateria([]);
        setLoading(false);
        return;
      }

      const promesasTareas = materiasAlumno.map((materia) =>
        api
          .get(`/tareas/alumno/materia/${materia._id}`)
          .then((res) => ({ ...materia, tareas: Array.isArray(res.data) ? res.data : [] }))
          .catch((err) => {
            console.error(`Error al cargar tareas de ${materia.nombre}:`, err);
            return { ...materia, tareas: [] };
          }),
      );

      const materiasConTareas = await Promise.all(promesasTareas);
      setTareasPorMateria(materiasConTareas);
    } catch (err) {
      console.error("Error al cargar las clases del alumno:", err);
      setError("No se pudieron cargar tus materias y tareas. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authCargando) return;
    if (alumnoId) {
      fetchTareas();
    } else {
      setLoading(false);
      setError("No se pudo identificar al usuario.");
    }
  }, [authCargando, alumnoId, fetchTareas]);

  useEffect(() => {
    if (!targetTareaId || loading) return;
    const targetElement = document.getElementById(`tarea-${targetTareaId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetTareaId, loading, tareasPorMateria]);

  const materiaFilterOptions = useMemo(
    () => [
      { value: "", label: "Todas las materias" },
      ...tareasPorMateria.map((materia) => ({
        value: String(materia._id),
        label: `${materia.nombre} (${materia.tareas.length})`,
      })),
    ],
    [tareasPorMateria],
  );

  const materiasVisibles = useMemo(() => {
    if (!selectedMateriaParam) return tareasPorMateria;
    return tareasPorMateria.filter((materia) => String(materia._id) === selectedMateriaParam);
  }, [tareasPorMateria, selectedMateriaParam]);

  const handleFilterMateria = (materiaId) => {
    const next = new URLSearchParams(searchParams);
    if (materiaId) next.set("materiaId", materiaId);
    else next.delete("materiaId");
    next.delete("tareaId");
    setSearchParams(next, { replace: true });
  };

  if (authCargando || loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-secondary" size={40} />
        <p className="text-sm font-medium text-slate-500">
          {authCargando ? "Verificando sesión..." : "Cargando tus tareas..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <AlertTriangle className="mx-auto mb-3" size={40} />
        <h2 className="text-lg font-bold">Ocurrió un error</h2>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
          <FileText size={14} /> Actividades
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">Mis tareas</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Revisa tus consignas, descarga material y sube tus entregas desde cada materia.
        </p>

        {tareasPorMateria.length > 1 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <FilterChips
              label="Filtrar tareas por materia"
              options={materiaFilterOptions}
              value={selectedMateriaParam}
              onChange={handleFilterMateria}
            />
          </div>
        )}
      </header>

      {materiasVisibles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <Inbox size={44} className="mx-auto text-slate-300" />
          <h2 className="mt-3 text-lg font-bold text-navy">¡Todo en orden!</h2>
          <p className="mt-1 text-sm text-slate-500">
            No tienes tareas pendientes o aún no estás inscripto en ninguna materia.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {materiasVisibles.map((materia) => (
            <section
              key={materia._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
            >
              <header className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                    <BookOpen size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-navy">{materia.nombre}</h2>
                    {materia.anio && (
                      <p className="text-xs font-medium text-slate-500">{materia.anio}° Año</p>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-slate-600">
                  {materia.tareas.length} tarea{materia.tareas.length === 1 ? "" : "s"}
                </span>
              </header>

              {materia.tareas.length === 0 ? (
                <p className="py-5 text-center text-sm text-slate-500">
                  No hay tareas asignadas para esta materia.
                </p>
              ) : (
                <ul>
                  {materia.tareas.map((tarea) => (
                    <TareaItem
                      key={tarea._id}
                      tarea={tarea}
                      alumnoId={alumnoId}
                      destacada={String(tarea._id) === targetTareaId}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default TareasAlumno;
