import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle,
  CircleCheck,
  FileDown,
  Loader2,
  MapPin,
  PauseCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Users,
} from "lucide-react";
import Swal from "sweetalert2";
import SlideOverDrawer from "../../components/admin/SlideOverDrawer";
import ModalExportarPlanilla from "../../components/ModalExportarPlanilla";
import { crearNominaClase } from "../../utils/exportadores/planillasAcademicas.js";
import {
  actualizarClase,
  asignarAlumnoAClase,
  cambiarEstadoAlumnoDeClase,
  crearClase,
  getAlumnosDeClase,
  getAlumnosPorCurso,
  setClaseActive,
} from "../../api/api";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const emptyForm = {
  materia: "",
  profesores: [],
  diaSemana: "Lunes",
  horaInicio: "",
  horaFin: "",
  aula: "",
};

const getFormFromClase = (clase) => {
  if (!clase) return emptyForm;
  return {
    materia: clase.materia?._id || clase.materia || "",
    profesores: (clase.profesores || []).map((profesor) => String(profesor._id || profesor)),
    diaSemana: clase.diaSemana || "Lunes",
    horaInicio: clase.horaInicio || "",
    horaFin: clase.horaFin || "",
    aula: clase.aula || "",
  };
};

const ClaseDetailDrawer = ({
  clase = null,
  mode = "detail",
  initialTab = "alumnos",
  materias = [],
  profesoresList = [],
  cycleId,
  selectedCycle,
  onClose,
  onSaved,
  onAlumnosChanged,
  onStatusChanged,
  onNotify,
}) => {
  const isCreateMode = mode === "create" || !clase;
  const readOnly = selectedCycle?.estado === "CERRADO";
  const claseId = clase?._id || clase?.id || null;

  const [activeTab, setActiveTab] = useState(isCreateMode ? "datos" : initialTab);
  const [form, setForm] = useState(() => getFormFromClase(clase));
  const [profesorQuery, setProfesorQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Estado de alumnos inscriptos / disponibles
  const [inscritos, setInscritos] = useState([]);
  const [suspendidos, setSuspendidos] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [errorAlumnos, setErrorAlumnos] = useState("");
  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [nominaAbierta, setNominaAbierta] = useState(false);
  const [documentoNomina, setDocumentoNomina] = useState(null);

  useEffect(() => {
    setForm(getFormFromClase(clase));
    setActiveTab(isCreateMode ? "datos" : initialTab);
    setProfesorQuery("");
    setBusquedaAlumno("");
    setNominaAbierta(false);
    setDocumentoNomina(null);
  }, [clase, initialTab, isCreateMode]);

  const cargarListasAlumnos = useCallback(async () => {
    if (!clase || !claseId) return;
    setLoadingAlumnos(true);
    setErrorAlumnos("");
    try {
      const [resInscritos, resCurso] = await Promise.all([
        getAlumnosDeClase(claseId),
        getAlumnosPorCurso(clase.anio, clase.division, cycleId),
      ]);
      const dataInscritos = resInscritos.data || resInscritos;
      const dataCurso = resCurso.data || resCurso;

      const inscripciones = Array.isArray(dataInscritos) ? dataInscritos : [];
      setInscritos(inscripciones.filter((alumno) => alumno.isActive));
      setSuspendidos(inscripciones.filter((alumno) => !alumno.isActive));

      if (Array.isArray(dataCurso) && Array.isArray(dataInscritos)) {
        const inscritosIds = new Set(dataInscritos.map((alumno) => String(alumno._id || alumno.id)));
        setDisponibles(dataCurso.filter((alumno) => !inscritosIds.has(String(alumno._id || alumno.id))));
      } else {
        setDisponibles([]);
      }
    } catch (error) {
      console.error("Error cargando listas de alumnos:", error);
      setErrorAlumnos("Error al cargar los alumnos. Verifica tu conexión.");
    } finally {
      setLoadingAlumnos(false);
    }
  }, [clase, claseId, cycleId]);

  useEffect(() => {
    if (!isCreateMode && claseId) {
      cargarListasAlumnos();
    }
  }, [isCreateMode, claseId, cargarListasAlumnos]);

  const filteredProfesores = useMemo(() => {
    const query = profesorQuery.trim().toLowerCase();
    if (!query) return profesoresList;
    return profesoresList.filter((profesor) =>
      [profesor.nombre, profesor.apellido, profesor.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [profesoresList, profesorQuery]);

  const disponiblesFiltrados = useMemo(() => {
    const query = busquedaAlumno.trim().toLowerCase();
    if (!query) return disponibles;
    return disponibles.filter((alumno) =>
      [alumno.nombre, alumno.apellido, alumno.email, alumno.dni]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [disponibles, busquedaAlumno]);

  const toggleProfesor = (profesorId) => {
    const id = String(profesorId);
    setForm((current) => ({
      ...current,
      profesores: current.profesores.includes(id)
        ? current.profesores.filter((item) => item !== id)
        : [...current.profesores, id],
    }));
  };

  const handleGuardarClase = async (event) => {
    event.preventDefault();
    if (readOnly) return;

    if (!form.materia || form.profesores.length === 0 || !form.horaInicio || !form.horaFin) {
      Swal.fire("Atención", "Por favor completa materia, al menos un profesor y horario.", "warning");
      return;
    }

    const selectedMateria = materias.find((materia) => String(materia._id) === String(form.materia));
    if (!selectedMateria) {
      Swal.fire("Atención", "Selecciona una materia válida.", "warning");
      return;
    }

    const payload = {
      materia: form.materia,
      profesores: form.profesores,
      anio: selectedMateria.anio,
      division: selectedMateria.division,
      diaSemana: form.diaSemana,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      aula: form.aula,
      cicloLectivoId: cycleId,
    };

    setSaving(true);
    try {
      if (isCreateMode) {
        await crearClase(payload);
        onNotify?.("success", "Clase registrada correctamente.");
      } else {
        await actualizarClase(claseId, payload);
        onNotify?.("success", "Clase actualizada correctamente.");
      }
      onSaved?.();
    } catch (error) {
      console.error("Error guardando clase:", error);
      Swal.fire("Error", error.response?.data?.msg || "Error al guardar la clase.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!clase || readOnly) return;
    const isActive = !clase.isActive;
    const confirm = await Swal.fire({
      title: isActive ? "¿Reactivar clase?" : "¿Suspender clase?",
      text: isActive
        ? "La clase volverá a estar disponible para el curso."
        : "La clase se conservará, pero dejará de estar disponible para docentes y alumnos.",
      icon: isActive ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isActive ? "#059669" : "#d97706",
      confirmButtonText: isActive ? "Sí, reactivar" : "Sí, suspender",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;
    try {
      const response = await setClaseActive(claseId, isActive);
      onStatusChanged?.(response.data.clase);
      onNotify?.("success", isActive ? "Clase reactivada." : "Clase suspendida.");
    } catch (error) {
      Swal.fire("Error", error.response?.data?.msg || "No se pudo cambiar el estado de la clase.", "error");
    }
  };

  const handleAsignarAlumno = async (alumno) => {
    if (readOnly || !claseId) return;
    try {
      setInscritos((current) => [...current, { ...alumno, isActive: true }]);
      setDisponibles((current) => current.filter((item) => item._id !== alumno._id));
      await asignarAlumnoAClase(claseId, alumno._id);
      onAlumnosChanged?.();
      onNotify?.("success", `${alumno.nombre} inscripto en la clase.`);
    } catch (error) {
      console.error("Error inscribiendo alumno:", error);
      Swal.fire("Error", error.response?.data?.msg || "No se pudo inscribir al alumno.", "error");
      cargarListasAlumnos();
    }
  };

  const handleSuspenderAlumno = async (alumno) => {
    if (readOnly || !claseId) return;
    const result = await Swal.fire({
      title: "¿Suspender inscripción?",
      text: `La inscripción de ${alumno.nombre} en ${clase.materia?.nombre || "la clase"} se conservará, pero dejará de estar activa.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, suspender",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await cambiarEstadoAlumnoDeClase(claseId, alumno._id, false);
      setInscritos((current) => current.filter((item) => item._id !== alumno._id));
      setSuspendidos((current) => [...current, { ...alumno, isActive: false }]);
      onAlumnosChanged?.();
      onNotify?.("info", "Inscripción suspendida.");
    } catch (error) {
      console.error("Error suspendiendo inscripción:", error);
      Swal.fire("Error", error.response?.data?.msg || "No se pudo suspender la inscripción.", "error");
      cargarListasAlumnos();
    }
  };

  const handleReactivarAlumno = async (alumno) => {
    if (readOnly || !claseId) return;
    try {
      await cambiarEstadoAlumnoDeClase(claseId, alumno._id, true);
      setSuspendidos((current) => current.filter((item) => item._id !== alumno._id));
      setInscritos((current) => [...current, { ...alumno, isActive: true }]);
      onAlumnosChanged?.();
      onNotify?.("success", "Inscripción reactivada.");
    } catch (error) {
      console.error("Error reactivando inscripción:", error);
      Swal.fire("Error", error.response?.data?.msg || "No se pudo reactivar la inscripción.", "error");
      cargarListasAlumnos();
    }
  };

  const abrirNomina = () => {
    if (!clase) return;
    setDocumentoNomina(
      crearNominaClase({
        clase,
        ciclo: { anio: selectedCycle?.anio },
        alumnos: [
          ...inscritos.map((alumno) => ({ ...alumno, isActive: true })),
          ...suspendidos.map((alumno) => ({ ...alumno, isActive: false })),
        ],
      }),
    );
    setNominaAbierta(true);
  };

  const title = isCreateMode
    ? "Nueva clase"
    : clase.materia?.nombre || "Detalle de clase";

  const description = isCreateMode
    ? selectedCycle?.nombre || "Asignar materia, docentes y horario"
    : `${clase.anio}° "${clase.division || "—"}" · ${clase.diaSemana || "Horario a definir"} ${clase.horaInicio || ""}${clase.horaFin ? ` - ${clase.horaFin}` : ""}${clase.aula ? ` · Aula ${clase.aula}` : ""}`;

  return (
    <>
      <SlideOverDrawer
        title={title}
        description={description}
        onClose={onClose}
        width={activeTab === "alumnos" && !isCreateMode ? "max-w-3xl" : "max-w-2xl"}
      >
        {!isCreateMode && (
          <nav
            className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 sm:px-7"
            aria-label="Secciones de detalle de clase"
          >
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("alumnos")}
                aria-current={activeTab === "alumnos" ? "page" : undefined}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                  activeTab === "alumnos"
                    ? "border-secondary text-secondary"
                    : "border-transparent text-slate-500 hover:text-navy"
                }`}
              >
                <Users size={15} />
                Alumnos
                <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-bold text-slate-600">
                  {loadingAlumnos ? "…" : inscritos.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("datos")}
                aria-current={activeTab === "datos" ? "page" : undefined}
                className={`border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                  activeTab === "datos"
                    ? "border-secondary text-secondary"
                    : "border-transparent text-slate-500 hover:text-navy"
                }`}
              >
                Datos y horario
              </button>
            </div>

            {activeTab === "alumnos" && (
              <button
                type="button"
                onClick={abrirNomina}
                disabled={loadingAlumnos || inscritos.length + suspendidos.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-blue-200 hover:bg-blue-50 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileDown size={14} />
                Exportar nómina
              </button>
            )}
          </nav>
        )}

        {readOnly && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs font-medium text-amber-900 sm:px-7">
            Modo Solo Lectura: las clases e inscripciones de un ciclo cerrado no se pueden modificar.
          </div>
        )}

        {activeTab === "alumnos" && !isCreateMode ? (
          <div className="p-5 sm:p-7">
            {loadingAlumnos ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-500" role="status">
                <Loader2 size={28} className="animate-spin text-secondary" />
                <p className="mt-3 text-sm font-medium">Sincronizando padrones del curso...</p>
              </div>
            ) : errorAlumnos ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p>{errorAlumnos}</p>
                    <button
                      type="button"
                      onClick={cargarListasAlumnos}
                      className="mt-2 font-semibold underline underline-offset-2"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Columna 1: Alumnos disponibles del curso */}
                <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-canvas p-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-navy">Disponibles del curso</h3>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        {disponiblesFiltrados.length}
                      </span>
                    </div>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={busquedaAlumno}
                        onChange={(event) => setBusquedaAlumno(event.target.value)}
                        placeholder="Buscar alumno o DNI..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                  <div className="max-h-[55vh] flex-1 space-y-2 overflow-y-auto p-3">
                    {disponiblesFiltrados.length === 0 ? (
                      <p className="py-10 text-center text-xs text-slate-500">
                        {busquedaAlumno.trim()
                          ? "Sin coincidencias para esa búsqueda."
                          : "Todos los alumnos activos del curso ya están registrados en esta clase."}
                      </p>
                    ) : (
                      disponiblesFiltrados.map((alumno) => (
                        <div
                          key={alumno._id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-2.5 transition hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy">
                              {alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre}
                            </p>
                            <p className="truncate text-xs text-slate-500">{alumno.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAsignarAlumno(alumno)}
                            disabled={readOnly}
                            title="Inscribir alumno"
                            aria-label={`Inscribir a ${alumno.nombre}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Columna 2: Inscriptos y suspendidos */}
                <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 p-3.5">
                    <h3 className="text-sm font-bold text-emerald-900">Inscriptos en la clase</h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      {inscritos.length}
                    </span>
                  </div>
                  <div className="max-h-[55vh] flex-1 space-y-2 overflow-y-auto p-3">
                    {inscritos.map((alumno) => (
                      <div
                        key={alumno._id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-2.5 transition hover:border-emerald-200"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <CheckCircle size={15} className="shrink-0 text-emerald-600" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy">
                              {alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre}
                            </p>
                            <p className="truncate text-xs text-slate-500">{alumno.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSuspenderAlumno(alumno)}
                          disabled={readOnly}
                          title="Suspender inscripción"
                          aria-label={`Suspender inscripción de ${alumno.nombre}`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PauseCircle size={16} />
                        </button>
                      </div>
                    ))}

                    {suspendidos.length > 0 && (
                      <div className="pt-3">
                        <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                          Inscripciones suspendidas ({suspendidos.length})
                        </p>
                        <div className="space-y-2">
                          {suspendidos.map((alumno) => {
                            const puedeReactivar =
                              alumno.alumnoActivo &&
                              Number(alumno.anio) === Number(clase.anio) &&
                              alumno.division === clase.division;
                            return (
                              <div
                                key={alumno._id}
                                className="flex items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-navy">
                                    {alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre}
                                  </p>
                                  <p className="truncate text-xs text-amber-800">{alumno.email} · Suspendido</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleReactivarAlumno(alumno)}
                                  disabled={readOnly || !puedeReactivar}
                                  title={
                                    puedeReactivar
                                      ? "Reactivar inscripción"
                                      : "El alumno debe estar activo y pertenecer al mismo curso"
                                  }
                                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <RotateCcw size={15} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {inscritos.length === 0 && suspendidos.length === 0 && (
                      <p className="py-10 text-center text-xs text-slate-500">
                        Todavía no hay alumnos inscriptos en esta clase.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleGuardarClase} className="space-y-5 p-5 sm:p-7">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                Materia <span className="text-red-500">*</span>
              </label>
              <select
                name="materia"
                value={form.materia}
                onChange={(event) => setForm((current) => ({ ...current, materia: event.target.value }))}
                disabled={readOnly}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
              >
                <option value="">-- Seleccionar materia --</option>
                {materias.map((materia) => (
                  <option key={materia._id} value={materia._id}>
                    {materia.nombre} ({materia.anio}° {materia.division})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                El año y la división se vinculan automáticamente desde la materia elegida.
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-sm font-semibold text-navy">
                  Profesores a cargo <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-semibold text-secondary">
                  {form.profesores.length} seleccionado{form.profesores.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="relative border-b border-slate-100 bg-canvas px-3 py-2">
                  <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={profesorQuery}
                    onChange={(event) => setProfesorQuery(event.target.value)}
                    disabled={readOnly}
                    placeholder="Filtrar docentes por nombre o correo..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
                <div className="max-h-44 divide-y divide-slate-100 overflow-y-auto">
                  {filteredProfesores.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-slate-500">No se encontraron docentes.</p>
                  ) : (
                    filteredProfesores.map((profesor) => {
                      const checked = form.profesores.includes(String(profesor._id));
                      return (
                        <button
                          key={profesor._id}
                          type="button"
                          disabled={readOnly}
                          onClick={() => toggleProfesor(profesor._id)}
                          className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition ${
                            checked ? "bg-blue-50/70 text-navy" : "hover:bg-canvas text-slate-700"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">
                              {profesor.nombre} {profesor.apellido || ""}
                            </span>
                            <span className="block truncate text-xs text-slate-500">{profesor.email}</span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                              checked
                                ? "border-secondary bg-secondary text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Check size={13} />
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Día de la semana</label>
                <select
                  name="diaSemana"
                  value={form.diaSemana}
                  onChange={(event) => setForm((current) => ({ ...current, diaSemana: event.target.value }))}
                  disabled={readOnly}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                >
                  {diasSemana.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Aula física</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="aula"
                    value={form.aula}
                    onChange={(event) => setForm((current) => ({ ...current, aula: event.target.value }))}
                    disabled={readOnly}
                    placeholder="Ej: Aula 101, Lab 2"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">
                  Hora inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="horaInicio"
                  value={form.horaInicio}
                  onChange={(event) => setForm((current) => ({ ...current, horaInicio: event.target.value }))}
                  disabled={readOnly}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">
                  Hora fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="horaFin"
                  value={form.horaFin}
                  onChange={(event) => setForm((current) => ({ ...current, horaFin: event.target.value }))}
                  disabled={readOnly}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              {!isCreateMode ? (
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={readOnly}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    clase.isActive
                      ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {clase.isActive ? <Ban size={14} /> : <CircleCheck size={14} />}
                  {clase.isActive ? "Suspender clase" : "Reactivar clase"}
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-canvas"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || readOnly}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isCreateMode ? "Crear clase" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </form>
        )}
      </SlideOverDrawer>

      <ModalExportarPlanilla
        abierto={nominaAbierta}
        onCerrar={() => setNominaAbierta(false)}
        documento={documentoNomina}
      />
    </>
  );
};

export default ClaseDetailDrawer;
