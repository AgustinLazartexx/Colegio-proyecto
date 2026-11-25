import { useMemo, useState } from "react";
import { CalendarRange, Check, ChevronLeft, ChevronRight, Copy, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  cambiarEstadoCiclo,
  cerrarCiclo,
  clonarClasesCiclo,
  crearCiclo,
  getPreviewCierreCiclo,
  importarAlumnosCiclo,
} from "../../api/api";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";

const estados = {
  PLANIFICADO: "Planificado",
  ACTIVO: "Activo",
  RECUPERACION: "Recuperación",
  CERRADO: "Cerrado",
};

const CiclosLectivosAdmin = () => {
  const { cycles, reloadCycles } = useAcademicCycles();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [nombre, setNombre] = useState("");
  const [working, setWorking] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [closingCycle, setClosingCycle] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bajas, setBajas] = useState([]);
  const cycleCards = useMemo(() => cycles, [cycles]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const cycleName = nombre.trim() || `Ciclo Lectivo ${anio}`;
    setWorking(true);
    try {
      await crearCiclo({ anio: Number(anio), nombre: cycleName });
      toast.success("Ciclo lectivo creado en estado PLANIFICADO.");
      setNombre("");
      await reloadCycles();
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo crear el ciclo lectivo.");
    } finally {
      setWorking(false);
    }
  };

  const handleStateChange = async (cycle, estado) => {
    setWorking(true);
    try {
      await cambiarEstadoCiclo(cycle._id, estado);
      toast.success(`El ciclo ahora está ${estados[estado].toLowerCase()}.`);
      await reloadCycles();
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo cambiar el estado del ciclo.");
    } finally {
      setWorking(false);
    }
  };

  const openCloseWizard = async (cycle) => {
    setWorking(true);
    setClosingCycle(cycle);
    setBajas([]);
    try {
      const { data } = await getPreviewCierreCiclo(cycle._id);
      setPreview(data);
      setWizardStep(1);
      setWizardOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo calcular el cierre.");
      setClosingCycle(null);
    } finally {
      setWorking(false);
    }
  };

  const handlePrepare = async (cycle) => {
    if (!window.confirm(`¿Preparar las clases e importar alumnos para ${cycle.nombre}?`)) return;
    setWorking(true);
    try {
      let cloned = null;
      try {
        ({ data: cloned } = await clonarClasesCiclo(cycle._id));
      } catch (error) {
        const alreadyPrepared = error.response?.status === 409 &&
          error.response?.data?.msg?.includes("El ciclo ya tiene clases");
        if (!alreadyPrepared) throw error;
      }
      const { data: imported } = await importarAlumnosCiclo(cycle._id);
      toast.success(
        `Preparación completa: ${cloned?.cantidad ?? "clases existentes"} y ${imported.inscriptos} alumnos importados.`,
      );
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo preparar el nuevo ciclo.");
    } finally {
      setWorking(false);
    }
  };

  const toggleBaja = (alumnoId) => {
    setBajas((current) => current.includes(alumnoId)
      ? current.filter((id) => id !== alumnoId)
      : [...current, alumnoId]);
  };

  const confirmClose = async () => {
    setWorking(true);
    try {
      await cerrarCiclo(closingCycle._id, bajas.map((alumnoId) => ({
        alumnoId,
        estadoAcademico: "BAJA",
      })));
      toast.success("Ciclo cerrado correctamente.");
      setWizardOpen(false);
      setPreview(null);
      setClosingCycle(null);
      await reloadCycles();
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo cerrar el ciclo.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-start gap-4">
          <div className="rounded-xl bg-indigo-600 p-3 text-white"><CalendarRange size={28} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Ciclos Lectivos</h1>
            <p className="mt-1 text-slate-600">Gestioná períodos, cierre académico y preparación del ciclo siguiente.</p>
          </div>
        </header>

        <form onSubmit={handleCreate} className="grid gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-[1fr_2fr_auto] md:items-end">
          <label className="text-sm font-medium text-slate-700">
            Año
            <input
              type="number"
              min="1900"
              max="9998"
              required
              value={anio}
              onChange={(event) => setAnio(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Nombre
            <input
              value={nombre}
              maxLength={100}
              onChange={(event) => setNombre(event.target.value)}
              placeholder={`Ciclo Lectivo ${anio}`}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <button disabled={working} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            <Plus size={18} /> Crear ciclo
          </button>
          <p className="text-xs text-slate-500 md:col-span-3">Fechas del ciclo: 2 de marzo al 2 de marzo del año siguiente. Los ciclos nuevos se crean planificados.</p>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Ciclos registrados</h2>
            <button type="button" onClick={reloadCycles} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              <RefreshCw size={16} /> Actualizar
            </button>
          </div>
          {cycleCards.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">Todavía no hay ciclos lectivos.</div>
          ) : cycleCards.map((cycle) => (
            <article key={cycle._id} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-slate-900">{cycle.nombre}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{estados[cycle.estado] || cycle.estado}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{cycle.fechaInicio} — {cycle.fechaCierre}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {cycle.estado === "PLANIFICADO" && (
                  <>
                    <button type="button" disabled={working} onClick={() => handleStateChange(cycle, "ACTIVO")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Activar</button>
                    <button type="button" disabled={working} onClick={() => handlePrepare(cycle)} className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                      <Copy size={16} /> Preparar nuevo ciclo
                    </button>
                  </>
                )}
                {cycle.estado === "ACTIVO" && (
                  <button type="button" disabled={working} onClick={() => handleStateChange(cycle, "RECUPERACION")} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">Iniciar recuperación</button>
                )}
                {cycle.estado === "RECUPERACION" && (
                  <>
                    <button type="button" disabled={working} onClick={() => handleStateChange(cycle, "ACTIVO")} className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Volver a cursado</button>
                    <button type="button" disabled={working} onClick={() => openCloseWizard(cycle)} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">Cerrar ciclo</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>

      {wizardOpen && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="close-cycle-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Paso {wizardStep} de 3</p>
                <h2 id="close-cycle-title" className="text-xl font-bold text-slate-900">Cierre de {closingCycle?.nombre}</h2>
              </div>
              <button type="button" onClick={() => setWizardOpen(false)} aria-label="Cerrar asistente" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <p className="text-slate-700">Resumen calculado para {preview.alumnos.length} alumno(s).</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-emerald-50 p-4"><p className="text-sm text-emerald-800">Promoción / egreso</p><p className="text-2xl font-bold">{preview.alumnos.filter((student) => ["PROMOVIDO", "EGRESADO"].includes(student.estadoSugerido)).length}</p></div>
                    <div className="rounded-lg bg-amber-50 p-4"><p className="text-sm text-amber-800">Con previas</p><p className="text-2xl font-bold">{preview.alumnos.filter((student) => ["PROMOVIDO_CON_PREVIAS", "EGRESADO_CON_PREVIAS"].includes(student.estadoSugerido)).length}</p></div>
                    <div className="rounded-lg bg-rose-50 p-4"><p className="text-sm text-rose-800">Repitencia sugerida</p><p className="text-2xl font-bold">{preview.alumnos.filter((student) => student.estadoSugerido === "REPITENTE").length}</p></div>
                  </div>
                  {!preview.sePuedeCerrar && (
                    <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
                      <p className="font-semibold">Aún no se puede cerrar.</p>
                      <p>{preview.cursosSinClases} curso(s) sin clases; completá todas las notas trimestrales.</p>
                    </div>
                  )}
                  <div className="max-h-64 overflow-auto rounded-lg border">
                    {preview.alumnos.map((student) => (
                      <div key={student._id} className="flex flex-wrap justify-between gap-2 border-b px-4 py-3 last:border-0">
                        <span className="font-medium">{student.nombre} · {student.nivel}° {student.division}</span>
                        <span className="text-sm text-slate-600">{student.estadoSugerido} · {student.cantidadDesaprobadas} desaprobada(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Revisá las materias desaprobadas. Podés marcar excepcionalmente alumnos como BAJA; las demás condiciones se calculan automáticamente.</p>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr><th className="p-3">Alumno</th><th className="p-3">Resultado sugerido</th><th className="p-3">Materias desaprobadas</th><th className="p-3">Ajuste</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.alumnos.map((student) => (
                          <tr key={student._id}>
                            <td className="p-3 font-medium">{student.nombre}<span className="block text-xs text-slate-500">{student.nivel}° {student.division}</span></td>
                            <td className="p-3">{student.estadoSugerido}</td>
                            <td className="p-3">{student.materiasDesaprobadas.length
                              ? student.materiasDesaprobadas.map((subject) => subject.materia).join(", ")
                              : "Ninguna"}</td>
                            <td className="p-3">
                              <label className="inline-flex items-center gap-2">
                                <input type="checkbox" checked={bajas.includes(student._id)} onChange={() => toggleBaja(student._id)} />
                                <span>Marcar BAJA</span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.alumnos.some((student) => student.materiasIncompletas.length > 0) && (
                    <p className="text-sm font-medium text-rose-700">Hay notas incompletas; completalas antes de continuar.</p>
                  )}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
                    <p className="font-bold">Esta acción es definitiva.</p>
                    <p className="mt-1 text-sm">El ciclo quedará en modo solo lectura y se generarán las materias previas correspondientes.</p>
                  </div>
                  <p>Alumnos evaluados: <strong>{preview.alumnos.length}</strong></p>
                  <p>Alumnos marcados como baja: <strong>{bajas.length}</strong></p>
                  <p>Alumnos promovidos/egresados/repetidores según cálculo: <strong>{preview.alumnos.length - bajas.length}</strong></p>
                </div>
              )}
            </div>

            <footer className="flex justify-between border-t p-4">
              <button type="button" onClick={() => wizardStep === 1 ? setWizardOpen(false) : setWizardStep((step) => step - 1)} className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
                {wizardStep === 1 ? <X size={17} /> : <ChevronLeft size={17} />}{wizardStep === 1 ? "Cancelar" : "Anterior"}
              </button>
              {wizardStep < 3 ? (
                <button
                  type="button"
                  disabled={working || (wizardStep === 1 && !preview.sePuedeCerrar) || (wizardStep === 2 && preview.alumnos.some((student) => student.materiasIncompletas.length > 0))}
                  onClick={() => setWizardStep((step) => step + 1)}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Continuar <ChevronRight size={17} />
                </button>
              ) : (
                <button type="button" disabled={working || !preview.sePuedeCerrar} onClick={confirmClose} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                  <Check size={17} /> Confirmar cierre
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </main>
  );
};

export default CiclosLectivosAdmin;
