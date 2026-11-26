import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  CircleCheck,
  ClipboardCheck,
  Clock,
  Download,
  FilePlus2,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  BACKEND_URL,
  actualizarAnuncio,
  calificarEntrega,
  crearAnuncio,
  crearTarea,
  eliminarTarea,
  getAlumnosDeClase,
  getCicloActivo,
  getClaseById,
  getEntregasTarea,
  getMisAnuncios,
  getMisClases,
  getTareasClase,
  obtenerAsistenciaFecha,
  registrarAsistencias,
  setAnuncioActive,
} from "../../api/api";
import DataTable from "../../components/admin/DataTable";
import FilterChips from "../../components/admin/FilterChips";
import Skeleton from "../../components/admin/Skeleton";
import SlideOverDrawer from "../../components/admin/SlideOverDrawer";
import CargarNotas from "./CargarNotas";

const TABS = [
  { id: "alumnos", label: "Alumnos", icon: Users },
  { id: "asistencia", label: "Asistencia", icon: CalendarCheck },
  { id: "tareas", label: "Tareas y Entregas", icon: FileText },
  { id: "notas", label: "Notas", icon: GraduationCap },
  { id: "anuncios", label: "Anuncios", icon: Megaphone },
];

const ATTENDANCE_OPTIONS = [
  { value: "presente", label: "Presente", active: "bg-emerald-600 text-white border-emerald-600", idle: "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700" },
  { value: "ausente", label: "Ausente", active: "bg-rose-600 text-white border-rose-600", idle: "bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-700" },
  { value: "tarde", label: "Tarde", active: "bg-amber-500 text-white border-amber-500", idle: "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700" },
  { value: "justificado", label: "Justificado", active: "bg-secondary text-white border-secondary", idle: "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-secondary" },
];

const getLocalToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (value, includeTime = false) => {
  if (!value) return "—";
  const parsed = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "—";
  return parsed.toLocaleDateString("es-AR", includeTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" });
};

const fullName = (person) =>
  [person?.nombre, person?.apellido].filter(Boolean).join(" ") || "Sin nombre";

// --- Tarjeta de entrega individual dentro del drawer ---
const EntregaItem = ({ entrega, onGuardar, readOnly }) => {
  const [nota, setNota] = useState(entrega.nota ?? "");
  const [comentario, setComentario] = useState(entrega.comentario ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNota(entrega.nota ?? "");
    setComentario(entrega.comentario ?? "");
  }, [entrega._id, entrega.nota, entrega.comentario]);

  const isGraded = entrega.nota !== null && entrega.nota !== undefined && entrega.nota !== "";

  const handleSave = async () => {
    if (readOnly) return;
    if (nota !== "") {
      const num = Number(nota);
      if (!Number.isFinite(num) || num < 0 || num > 10) {
        toast.warning("La nota debe estar entre 0 y 10.");
        return;
      }
    }
    setSaving(true);
    try {
      await onGuardar(entrega._id, nota === "" ? undefined : Number(nota), comentario);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-navy">{fullName(entrega.alumno)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Entregado: {formatDate(entrega.fechaEntrega || entrega.createdAt, true)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isGraded ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
          }`}
        >
          {isGraded ? `Nota: ${entrega.nota}` : "Pendiente"}
        </span>
      </div>

      {entrega.archivo && (
        <a
          href={`${BACKEND_URL}/uploads/${entrega.archivo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-blue-100"
        >
          <Download size={14} aria-hidden="true" />
          Descargar archivo adjunto
        </a>
      )}

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-[100px_1fr]">
        <label className="block text-xs font-semibold text-slate-600">
          Nota (0-10)
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={nota}
            disabled={readOnly || saving}
            onChange={(event) => setNota(event.target.value)}
            placeholder="0-10"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50 disabled:bg-canvas"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Devolución
          <textarea
            rows={2}
            value={comentario}
            disabled={readOnly || saving}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Comentario para el alumno..."
            className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50 disabled:bg-canvas"
          />
        </label>
      </div>

      {!readOnly && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Guardando..." : "Guardar corrección"}
          </button>
        </div>
      )}
    </article>
  );
};

const EspacioMateria = () => {
  const { claseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : "alumnos";
  const initialTareaId = searchParams.get("tareaId") || "";

  // Contexto de clase, lista de clases del docente y ciclo lectivo
  const [clase, setClase] = useState(null);
  const [misClases, setMisClases] = useState([]);
  const [ciclo, setCiclo] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState("");

  // Alumnos
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);
  const [busquedaAlumno, setBusquedaAlumno] = useState("");

  // Asistencia
  const [fechaAsistencia, setFechaAsistencia] = useState(getLocalToday);
  const [asistencias, setAsistencias] = useState({});
  const [loadingAsistencia, setLoadingAsistencia] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  // Tareas y Entregas
  const [tareas, setTareas] = useState([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [drawerCrearTarea, setDrawerCrearTarea] = useState(false);
  const [formTarea, setFormTarea] = useState({ titulo: "", descripcion: "", fechaEntrega: "" });
  const [archivoTarea, setArchivoTarea] = useState(null);
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  const [tareaEntregasActiva, setTareaEntregasActiva] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [loadingEntregas, setLoadingEntregas] = useState(false);
  const [filtroEntregas, setFiltroEntregas] = useState("todas");

  // Anuncios
  const [anuncios, setAnuncios] = useState([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(false);
  const [drawerAnuncio, setDrawerAnuncio] = useState(false);
  const [anuncioEditandoId, setAnuncioEditandoId] = useState(null);
  const [formAnuncio, setFormAnuncio] = useState({ titulo: "", mensaje: "" });
  const [guardandoAnuncio, setGuardandoAnuncio] = useState(false);

  const materiaId = clase?.materia?._id || clase?.materia?.id || "";
  const materiaNombre = clase?.materia?.nombre || "Materia";
  const profesorNombre = useMemo(
    () => (clase?.profesores || []).map((p) => p.nombre).filter(Boolean).join(", "),
    [clase],
  );
  const cycleReadOnly = Boolean(ciclo && !["ACTIVO", "RECUPERACION"].includes(ciclo.estado));

  const setActiveTab = useCallback(
    (tabId) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", tabId);
      if (tabId !== "tareas") next.delete("tareaId");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // 1. Cargar contexto base (clase actual + mis clases + ciclo + alumnos)
  useEffect(() => {
    let active = true;
    const loadContext = async () => {
      setLoadingContext(true);
      setLoadingAlumnos(true);
      setContextError("");
      try {
        const [claseRes, clasesRes, cicloRes, alumnosRes] = await Promise.allSettled([
          getClaseById(claseId),
          getMisClases(),
          getCicloActivo(),
          getAlumnosDeClase(claseId),
        ]);
        if (!active) return;

        if (claseRes.status !== "fulfilled") {
          setContextError(
            claseRes.reason?.response?.data?.msg || "No se pudo cargar la clase seleccionada.",
          );
          return;
        }
        setClase(claseRes.value.data);

        if (clasesRes.status === "fulfilled") {
          const list = clasesRes.value.data?.clases || clasesRes.value.data || [];
          setMisClases(Array.isArray(list) ? list : []);
        }
        if (cicloRes.status === "fulfilled") {
          setCiclo(cicloRes.value.data);
        }
        if (alumnosRes.status === "fulfilled") {
          const list = Array.isArray(alumnosRes.value.data)
            ? alumnosRes.value.data
            : alumnosRes.value.data?.alumnos || [];
          setAlumnos(list);
        } else {
          setAlumnos([]);
        }
      } catch (error) {
        if (!active) return;
        console.error("Error cargando espacio de materia:", error);
        setContextError("Ocurrió un error al cargar el espacio de la materia.");
      } finally {
        if (active) {
          setLoadingContext(false);
          setLoadingAlumnos(false);
        }
      }
    };

    loadContext();
    return () => {
      active = false;
    };
  }, [claseId]);

  // 2. Cargar asistencia cuando se entra al tab o cambia fecha/alumnos
  useEffect(() => {
    if (activeTab !== "asistencia" || !claseId || loadingAlumnos) return undefined;
    let active = true;
    const loadAttendance = async () => {
      setLoadingAsistencia(true);
      try {
        const { data } = await obtenerAsistenciaFecha(claseId, fechaAsistencia);
        if (!active) return;
        const historial = data || {};
        const inicial = {};
        alumnos.forEach((alumno) => {
          inicial[alumno._id] = historial[alumno._id] || "presente";
        });
        setAsistencias(inicial);
      } catch (error) {
        if (!active) return;
        console.error("Error consultando asistencia:", error);
        toast.error(error.response?.data?.msg || "No se pudo consultar la asistencia.");
      } finally {
        if (active) setLoadingAsistencia(false);
      }
    };
    loadAttendance();
    return () => {
      active = false;
    };
  }, [activeTab, claseId, fechaAsistencia, alumnos, loadingAlumnos]);

  // 3. Cargar tareas de la clase
  const cargarTareas = useCallback(async () => {
    if (!claseId) return;
    setLoadingTareas(true);
    try {
      const { data } = await getTareasClase(claseId);
      setTareas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando tareas de la clase:", error);
      toast.error(error.response?.data?.msg || "No se pudieron cargar las tareas.");
    } finally {
      setLoadingTareas(false);
    }
  }, [claseId]);

  useEffect(() => {
    if (activeTab === "tareas" && claseId) {
      cargarTareas();
    }
  }, [activeTab, claseId, cargarTareas]);

  // Abrir entregas de una tarea en SlideOverDrawer
  const abrirEntregas = useCallback(async (tarea) => {
    setTareaEntregasActiva(tarea);
    setFiltroEntregas("todas");
    setLoadingEntregas(true);
    try {
      const { data } = await getEntregasTarea(tarea._id);
      setEntregas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando entregas:", error);
      toast.error(error.response?.data?.msg || "No se pudieron cargar las entregas.");
      setEntregas([]);
    } finally {
      setLoadingEntregas(false);
    }
  }, []);

  // Si viene tareaId en la URL (ej. desde InicioProfesor), abrir el drawer automáticamente
  useEffect(() => {
    if (activeTab !== "tareas" || !initialTareaId || !tareas.length) return;
    const match = tareas.find((t) => t._id === initialTareaId);
    if (match && tareaEntregasActiva?._id !== match._id) {
      abrirEntregas(match);
    }
  }, [activeTab, initialTareaId, tareas, tareaEntregasActiva?._id, abrirEntregas]);

  // 4. Cargar anuncios filtrados a esta materia
  const cargarAnuncios = useCallback(async () => {
    if (!materiaId) return;
    setLoadingAnuncios(true);
    try {
      const { data } = await getMisAnuncios();
      const todos = Array.isArray(data) ? data : [];
      setAnuncios(
        todos.filter((item) => (item.materia?._id || item.materia) === materiaId),
      );
    } catch (error) {
      console.error("Error cargando anuncios:", error);
      toast.error("No se pudieron cargar los anuncios.");
    } finally {
      setLoadingAnuncios(false);
    }
  }, [materiaId]);

  useEffect(() => {
    if (activeTab === "anuncios" && materiaId) {
      cargarAnuncios();
    }
  }, [activeTab, materiaId, cargarAnuncios]);

  // --- Handlers de Asistencia ---
  const marcarTodosAsistencia = (estado) => {
    const next = {};
    alumnos.forEach((alumno) => {
      next[alumno._id] = estado;
    });
    setAsistencias(next);
  };

  const guardarAsistencia = async () => {
    if (cycleReadOnly || !alumnos.length) return;
    setGuardandoAsistencia(true);
    try {
      await registrarAsistencias({
        claseId,
        fecha: fechaAsistencia,
        asistencias: alumnos.map((alumno) => ({
          alumno: alumno._id,
          estado: asistencias[alumno._id] || "presente",
        })),
      });
      toast.success("Asistencia guardada correctamente.");
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      toast.error(error.response?.data?.msg || "No se pudo guardar la asistencia.");
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  // --- Handlers de Tareas y Entregas ---
  const handleCrearTarea = async (event) => {
    event.preventDefault();
    if (!materiaId || cycleReadOnly) return;
    setGuardandoTarea(true);
    const formData = new FormData();
    formData.append("titulo", formTarea.titulo.trim());
    formData.append("descripcion", formTarea.descripcion.trim());
    formData.append("fechaEntrega", formTarea.fechaEntrega);
    formData.append("materia", materiaId);
    if (ciclo?._id) formData.append("cicloLectivoId", ciclo._id);
    if (archivoTarea) formData.append("archivo", archivoTarea);

    try {
      await crearTarea(formData);
      toast.success("Tarea publicada correctamente.");
      setFormTarea({ titulo: "", descripcion: "", fechaEntrega: "" });
      setArchivoTarea(null);
      setDrawerCrearTarea(false);
      await cargarTareas();
    } catch (error) {
      console.error("Error creando tarea:", error);
      toast.error(error.response?.data?.msg || "No se pudo crear la tarea.");
    } finally {
      setGuardandoTarea(false);
    }
  };

  const handleEliminarTarea = async (tarea) => {
    if (cycleReadOnly) return;
    if (!window.confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) return;
    try {
      await eliminarTarea(tarea._id);
      toast.success("Tarea eliminada.");
      setTareas((prev) => prev.filter((item) => item._id !== tarea._id));
      if (tareaEntregasActiva?._id === tarea._id) setTareaEntregasActiva(null);
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo eliminar la tarea.");
    }
  };

  const handleCorregirEntrega = async (entregaId, nota, comentario) => {
    try {
      const { data } = await calificarEntrega(entregaId, {
        ...(nota !== undefined ? { nota } : {}),
        comentario,
      });
      const updated = data?.entrega;
      setEntregas((prev) =>
        prev.map((item) =>
          item._id === entregaId
            ? updated || { ...item, nota: nota ?? item.nota, comentario }
            : item,
        ),
      );
      toast.success("Corrección guardada.");
    } catch (error) {
      console.error("Error corrigiendo entrega:", error);
      toast.error(error.response?.data?.msg || "No se pudo guardar la corrección.");
    }
  };

  // --- Handlers de Anuncios ---
  const abrirNuevoAnuncio = () => {
    setAnuncioEditandoId(null);
    setFormAnuncio({ titulo: "", mensaje: "" });
    setDrawerAnuncio(true);
  };

  const abrirEditarAnuncio = (anuncio) => {
    setAnuncioEditandoId(anuncio._id);
    setFormAnuncio({ titulo: anuncio.titulo || "", mensaje: anuncio.mensaje || "" });
    setDrawerAnuncio(true);
  };

  const handleGuardarAnuncio = async (event) => {
    event.preventDefault();
    if (!formAnuncio.titulo.trim() || !formAnuncio.mensaje.trim()) {
      toast.warning("Completá título y mensaje.");
      return;
    }
    setGuardandoAnuncio(true);
    try {
      const payload = {
        materia: materiaId,
        titulo: formAnuncio.titulo.trim(),
        mensaje: formAnuncio.mensaje.trim(),
      };
      if (anuncioEditandoId) {
        const { data } = await actualizarAnuncio(anuncioEditandoId, payload);
        const actualizado = data.anuncio || data;
        setAnuncios((prev) => prev.map((item) => (item._id === anuncioEditandoId ? actualizado : item)));
        toast.success("Anuncio actualizado.");
      } else {
        const { data } = await crearAnuncio(payload);
        const creado = data.anuncio || data;
        setAnuncios((prev) => [creado, ...prev]);
        toast.success("Anuncio publicado.");
      }
      setDrawerAnuncio(false);
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo guardar el anuncio.");
    } finally {
      setGuardandoAnuncio(false);
    }
  };

  const handleToggleAnuncio = async (anuncio) => {
    const nextActive = !anuncio.isActive;
    if (!window.confirm(`¿Querés ${nextActive ? "reactivar" : "suspender"} este anuncio?`)) return;
    try {
      const { data } = await setAnuncioActive(anuncio._id, nextActive);
      const actualizado = data.anuncio || data;
      setAnuncios((prev) => prev.map((item) => (item._id === anuncio._id ? actualizado : item)));
      toast.success(nextActive ? "Anuncio reactivado." : "Anuncio suspendido.");
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo cambiar el estado.");
    }
  };

  // --- Derivados ---
  const alumnosFiltrados = useMemo(() => {
    const q = busquedaAlumno.trim().toLowerCase();
    if (!q) return alumnos;
    return alumnos.filter((alumno) =>
      [fullName(alumno), alumno.email, alumno.dni]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [alumnos, busquedaAlumno]);

  const resumenAsistencia = useMemo(() => {
    const counts = { presente: 0, ausente: 0, tarde: 0, justificado: 0 };
    alumnos.forEach((alumno) => {
      const state = asistencias[alumno._id] || "presente";
      if (Object.hasOwn(counts, state)) counts[state] += 1;
    });
    return counts;
  }, [alumnos, asistencias]);

  const entregasFiltradas = useMemo(() => {
    if (filtroEntregas === "pendientes") {
      return entregas.filter((e) => e.nota === null || e.nota === undefined || e.nota === "");
    }
    if (filtroEntregas === "corregidas") {
      return entregas.filter((e) => e.nota !== null && e.nota !== undefined && e.nota !== "");
    }
    return entregas;
  }, [entregas, filtroEntregas]);

  const columnasAlumnos = useMemo(
    () => [
      {
        key: "nombre",
        label: "Alumno",
        render: (alumno) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-secondary">
              {(alumno.nombre || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-navy">{fullName(alumno)}</p>
              <p className="text-xs text-slate-500">DNI: {alumno.dni || "No informado"}</p>
            </div>
          </div>
        ),
      },
      {
        key: "email",
        label: "Correo",
        render: (alumno) => (
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Mail size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            {alumno.email || "—"}
          </span>
        ),
      },
      {
        key: "curso",
        label: "Curso",
        render: (alumno) => (
          <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-slate-700">
            {alumno.anio ?? clase?.anio}° &quot;{alumno.division || clase?.division}&quot;
          </span>
        ),
      },
    ],
    [clase?.anio, clase?.division],
  );

  if (loadingContext) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <Skeleton className="h-36 w-full" rounded="rounded-3xl" />
        <Skeleton className="h-14 w-full" rounded="rounded-2xl" />
        <Skeleton className="h-72 w-full" rounded="rounded-2xl" />
      </div>
    );
  }

  if (contextError || !clase) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-900">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-600" />
        <p className="font-semibold">{contextError || "Clase no encontrada."}</p>
        <Link
          to="/profesor/Clases"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Volver a mis clases
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Encabezado de la materia */}
      <header className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/profesor/Clases"
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-canvas hover:text-navy"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Volver a mis clases
          </Link>

          {misClases.length > 1 && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Cambiar clase:</span>
              <select
                value={claseId}
                onChange={(event) => navigate(`/profesor/Clases/${event.target.value}?tab=${activeTab}`)}
                className="rounded-xl border border-slate-200 bg-canvas px-3 py-1.5 text-xs font-semibold text-navy outline-none focus:border-secondary"
              >
                {misClases.map((item) => (
                  <option key={item._id || item.id} value={item._id || item.id}>
                    {item.materia?.nombre} ({item.anio}° {item.division} · {item.diaSemana} {item.horaInicio})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-secondary">
                <BookOpen size={13} aria-hidden="true" />
                {clase.nivel ?? clase.anio}° Año &quot;{clase.division}&quot;
              </span>
              {ciclo && (
                <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-slate-600">
                  {ciclo.nombre} · {ciclo.estado}
                </span>
              )}
            </div>
            <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {materiaNombre}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={15} aria-hidden="true" /> {clase.diaSemana}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} aria-hidden="true" /> {clase.horaInicio}–{clase.horaFin} hs
              </span>
              {clase.aula && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden="true" /> Aula {clase.aula}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Users size={15} aria-hidden="true" /> {alumnos.length} alumno{alumnos.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación por pestañas */}
      <nav
        role="tablist"
        aria-label="Secciones de la materia"
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm"
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                selected
                  ? "bg-secondary text-white shadow-sm"
                  : "text-slate-600 hover:bg-canvas hover:text-navy"
              }`}
            >
              {createElement(tab.icon, { size: 17, "aria-hidden": true })}
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: ALUMNOS */}
      {activeTab === "alumnos" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-navy">Alumnos inscriptos</h2>
              <p className="text-xs text-slate-500">
                {alumnosFiltrados.length} de {alumnos.length} estudiante{alumnos.length === 1 ? "" : "s"}
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={busquedaAlumno}
                onChange={(event) => setBusquedaAlumno(event.target.value)}
                placeholder="Buscar por nombre, DNI o correo..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>
          <DataTable
            rows={alumnosFiltrados}
            columns={columnasAlumnos}
            loading={loadingAlumnos}
            emptyState={
              <div className="mx-auto max-w-sm">
                <Users size={34} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800">No hay alumnos para mostrar</p>
                <p className="mt-1 text-sm text-slate-500">
                  {busquedaAlumno
                    ? "Probá con otro término de búsqueda."
                    : "Todavía no hay estudiantes inscriptos en esta clase."}
                </p>
              </div>
            }
          />
        </section>
      )}

      {/* TAB 2: ASISTENCIA */}
      {activeTab === "asistencia" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-navy">Registro de asistencia</h2>
              <p className="text-xs text-slate-500">
                Seleccioná la fecha y marcá el estado de cada alumno en un clic.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                aria-label="Fecha de asistencia"
                value={fechaAsistencia}
                onChange={(event) => setFechaAsistencia(event.target.value)}
                className="rounded-xl border border-slate-200 bg-canvas px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-secondary"
              />
              {!cycleReadOnly && alumnos.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => marcarTodosAsistencia("presente")}
                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Todos presentes
                  </button>
                  <button
                    type="button"
                    onClick={() => marcarTodosAsistencia("ausente")}
                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Todos ausentes
                  </button>
                </>
              )}
            </div>
          </div>

          {alumnos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-canvas/60 px-5 py-3 sm:grid-cols-4">
              <div className="rounded-xl bg-white px-3 py-2 text-xs">
                <span className="text-slate-500">Presentes</span>
                <p className="text-base font-bold text-emerald-700">{resumenAsistencia.presente}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-xs">
                <span className="text-slate-500">Ausentes</span>
                <p className="text-base font-bold text-rose-700">{resumenAsistencia.ausente}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-xs">
                <span className="text-slate-500">Tarde</span>
                <p className="text-base font-bold text-amber-600">{resumenAsistencia.tarde}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-xs">
                <span className="text-slate-500">Justificados</span>
                <p className="text-base font-bold text-secondary">{resumenAsistencia.justificado}</p>
              </div>
            </div>
          )}

          {loadingAsistencia ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin text-secondary" />
              Cargando asistencias...
            </div>
          ) : alumnos.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              No hay alumnos inscriptos en esta clase para tomar asistencia.
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {alumnos.map((alumno) => {
                  const estadoActual = asistencias[alumno._id] || "presente";
                  return (
                    <li
                      key={alumno._id}
                      className="flex flex-col gap-3 px-5 py-3.5 transition hover:bg-blue-50/30 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-navy">{fullName(alumno)}</p>
                        <p className="text-xs text-slate-500">DNI: {alumno.dni || "N/D"}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Asistencia de ${fullName(alumno)}`}>
                        {ATTENDANCE_OPTIONS.map((option) => {
                          const active = estadoActual === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={cycleReadOnly}
                              onClick={() =>
                                setAsistencias((prev) => ({ ...prev, [alumno._id]: option.value }))
                              }
                              aria-pressed={active}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                active ? option.active : option.idle
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-canvas/50 px-5 py-4">
                <p className="text-xs text-slate-500">
                  {cycleReadOnly
                    ? "Este ciclo está en modo solo lectura."
                    : `Registrando para el ${formatDate(fechaAsistencia)}.`}
                </p>
                <button
                  type="button"
                  disabled={cycleReadOnly || guardandoAsistencia}
                  onClick={guardarAsistencia}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardandoAsistencia ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {guardandoAsistencia ? "Guardando..." : "Guardar asistencia"}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* TAB 3: TAREAS Y ENTREGAS */}
      {activeTab === "tareas" && (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-navy">Tareas y entregas</h2>
              <p className="text-xs text-slate-500">
                Publicá consignas para {materiaNombre} y corregí las entregas sin cambiar de pantalla.
              </p>
            </div>
            <button
              type="button"
              disabled={cycleReadOnly}
              onClick={() => setDrawerCrearTarea(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FilePlus2 size={17} aria-hidden="true" />
              Nueva tarea
            </button>
          </div>

          {loadingTareas ? (
            <div className="space-y-3">
              {[0, 1].map((item) => (
                <Skeleton key={item} className="h-28 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : tareas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <ClipboardCheck size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-800">Todavía no hay tareas publicadas</p>
              <p className="mt-1 text-sm text-slate-500">
                Creá la primera consigna para que tus alumnos puedan subir sus entregas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tareas.map((tarea) => (
                <article
                  key={tarea._id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-200 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-navy">{tarea.titulo}</h3>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                        Entrega: {formatDate(tarea.fechaEntrega)}
                      </span>
                    </div>
                    {tarea.descripcion && (
                      <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{tarea.descripcion}</p>
                    )}
                    {tarea.archivo && (
                      <a
                        href={`${BACKEND_URL}/uploads/${tarea.archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                      >
                        <Download size={13} aria-hidden="true" /> Ver material adjunto
                      </a>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEntregas(tarea)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-blue-100"
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Ver entregas
                    </button>
                    {!cycleReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleEliminarTarea(tarea)}
                        title="Eliminar tarea"
                        aria-label={`Eliminar ${tarea.titulo}`}
                        className="rounded-xl p-2.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: NOTAS */}
      {activeTab === "notas" && (
        <CargarNotas
          materiaId={materiaId}
          claseId={clase._id || clase.id}
          materiaNombre={materiaNombre}
          anio={clase.nivel ?? clase.anio}
          division={clase.division}
          profesorNombre={profesorNombre}
          horaInicio={clase.horaInicio}
          horaFin={clase.horaFin}
          cicloAnio={ciclo?.anio}
          cicloLectivoId={ciclo?._id}
          cicloEstado={ciclo?.estado}
          readOnly={cycleReadOnly}
        />
      )}

      {/* TAB 5: ANUNCIOS */}
      {activeTab === "anuncios" && (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-navy">Anuncios de {materiaNombre}</h2>
              <p className="text-xs text-slate-500">
                Publicá, editá o suspendé avisos visibles para los alumnos de esta materia.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirNuevoAnuncio}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <Plus size={17} aria-hidden="true" />
              Nuevo anuncio
            </button>
          </div>

          {loadingAnuncios ? (
            <div className="space-y-3">
              {[0, 1].map((item) => (
                <Skeleton key={item} className="h-24 w-full" rounded="rounded-2xl" />
              ))}
            </div>
          ) : anuncios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Megaphone size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-800">Sin anuncios en esta materia</p>
              <p className="mt-1 text-sm text-slate-500">
                Usá &quot;Nuevo anuncio&quot; para compartir novedades o fechas de exámenes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {anuncios.map((anuncio) => (
                <article
                  key={anuncio._id}
                  className={`flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-start ${
                    anuncio.isActive ? "border-slate-200/80" : "border-amber-200 bg-amber-50/40"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          anuncio.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {anuncio.isActive ? "Activo" : "Suspendido"}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(anuncio.fecha)}</span>
                    </div>
                    <h3 className="mt-1.5 text-base font-bold text-navy">{anuncio.titulo}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{anuncio.mensaje}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEditarAnuncio(anuncio)}
                      title="Editar anuncio"
                      aria-label={`Editar ${anuncio.titulo}`}
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-canvas hover:text-navy"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAnuncio(anuncio)}
                      title={anuncio.isActive ? "Suspender anuncio" : "Reactivar anuncio"}
                      aria-label={anuncio.isActive ? `Suspender ${anuncio.titulo}` : `Reactivar ${anuncio.titulo}`}
                      className={`rounded-xl p-2 transition ${
                        anuncio.isActive
                          ? "text-amber-600 hover:bg-amber-100"
                          : "text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {anuncio.isActive ? <Ban size={17} /> : <CircleCheck size={17} />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* DRAWER: CREAR TAREA */}
      {drawerCrearTarea && (
        <SlideOverDrawer
          title="Nueva tarea"
          description={`${materiaNombre} · ${clase.nivel ?? clase.anio}° "${clase.division}"`}
          onClose={() => setDrawerCrearTarea(false)}
        >
          <form onSubmit={handleCrearTarea} className="space-y-5 p-5 sm:p-7">
            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input
                type="text"
                required
                value={formTarea.titulo}
                onChange={(event) => setFormTarea((prev) => ({ ...prev, titulo: event.target.value }))}
                placeholder="Ej: Trabajo práctico N° 3"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Consigna / descripción
              <textarea
                rows={4}
                required
                value={formTarea.descripcion}
                onChange={(event) => setFormTarea((prev) => ({ ...prev, descripcion: event.target.value }))}
                placeholder="Indicá objetivos, pautas de entrega o criterios..."
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Fecha límite de entrega
              <input
                type="date"
                required
                value={formTarea.fechaEntrega}
                onChange={(event) => setFormTarea((prev) => ({ ...prev, fechaEntrega: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <div>
              <span className="block text-sm font-semibold text-slate-700">Archivo adjunto (opcional)</span>
              <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-canvas/50 px-4 py-6 text-center transition hover:border-secondary">
                <Upload size={22} className="text-secondary" />
                <span className="mt-2 text-xs font-semibold text-slate-700">
                  {archivoTarea ? archivoTarea.name : "Hacé clic para adjuntar PDF, Word o imagen"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(event) => setArchivoTarea(event.target.files?.[0] || null)}
                  className="sr-only"
                />
              </label>
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDrawerCrearTarea(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-canvas"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoTarea}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {guardandoTarea ? <Loader2 size={16} className="animate-spin" /> : <FilePlus2 size={16} />}
                {guardandoTarea ? "Publicando..." : "Publicar tarea"}
              </button>
            </footer>
          </form>
        </SlideOverDrawer>
      )}

      {/* DRAWER: ENTREGAS DE UNA TAREA */}
      {tareaEntregasActiva && (
        <SlideOverDrawer
          title={tareaEntregasActiva.titulo}
          description={`Entregas recibidas · Vence ${formatDate(tareaEntregasActiva.fechaEntrega)}`}
          width="max-w-2xl"
          onClose={() => {
            setTareaEntregasActiva(null);
            if (searchParams.get("tareaId")) {
              const next = new URLSearchParams(searchParams);
              next.delete("tareaId");
              setSearchParams(next, { replace: true });
            }
          }}
        >
          <div className="space-y-4 p-5 sm:p-7">
            <FilterChips
              label="Filtrar entregas"
              value={filtroEntregas}
              onChange={setFiltroEntregas}
              options={[
                { value: "todas", label: `Todas (${entregas.length})` },
                {
                  value: "pendientes",
                  label: `Pendientes (${entregas.filter((e) => e.nota === null || e.nota === undefined || e.nota === "").length})`,
                },
                {
                  value: "corregidas",
                  label: `Corregidas (${entregas.filter((e) => e.nota !== null && e.nota !== undefined && e.nota !== "").length})`,
                },
              ]}
            />

            {loadingEntregas ? (
              <div className="space-y-3">
                {[0, 1].map((item) => (
                  <Skeleton key={item} className="h-32 w-full" rounded="rounded-2xl" />
                ))}
              </div>
            ) : entregasFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-canvas/50 px-6 py-12 text-center text-sm text-slate-500">
                {entregas.length === 0
                  ? "Todavía ningún alumno entregó esta tarea."
                  : "No hay entregas con este filtro."}
              </div>
            ) : (
              <div className="space-y-4">
                {entregasFiltradas.map((entrega) => (
                  <EntregaItem
                    key={entrega._id}
                    entrega={entrega}
                    onGuardar={handleCorregirEntrega}
                    readOnly={cycleReadOnly}
                  />
                ))}
              </div>
            )}
          </div>
        </SlideOverDrawer>
      )}

      {/* DRAWER: CREAR / EDITAR ANUNCIO */}
      {drawerAnuncio && (
        <SlideOverDrawer
          title={anuncioEditandoId ? "Editar anuncio" : "Nuevo anuncio"}
          description={`${materiaNombre} · ${clase.nivel ?? clase.anio}° "${clase.division}"`}
          onClose={() => setDrawerAnuncio(false)}
        >
          <form onSubmit={handleGuardarAnuncio} className="space-y-5 p-5 sm:p-7">
            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input
                type="text"
                required
                value={formAnuncio.titulo}
                onChange={(event) => setFormAnuncio((prev) => ({ ...prev, titulo: event.target.value }))}
                placeholder="Ej: Evaluación trimestral"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Mensaje
              <textarea
                rows={5}
                required
                value={formAnuncio.mensaje}
                onChange={(event) => setFormAnuncio((prev) => ({ ...prev, mensaje: event.target.value }))}
                placeholder="Escribí el aviso para los alumnos..."
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-secondary focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDrawerAnuncio(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-canvas"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoAnuncio}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {guardandoAnuncio ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {anuncioEditandoId ? "Guardar cambios" : "Publicar anuncio"}
              </button>
            </footer>
          </form>
        </SlideOverDrawer>
      )}
    </div>
  );
};

export default EspacioMateria;
