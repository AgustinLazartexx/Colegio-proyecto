import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Eye,
  FileDown,
  GraduationCap,
  IdCard,
  Loader2,
  UserRound,
} from "lucide-react";
import {
  getMisAsistenciasAlumno,
  getMisClasesAlumno,
  getMisMateriasPrevias,
  getMisNotasAlumno,
} from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import CycleSelector, { CycleStatusNotice } from "../../components/admin/CycleSelector";
import Skeleton, { SkeletonTable } from "../../components/admin/Skeleton";
import ModalExportarPlanilla from "../../components/ModalExportarPlanilla";
import { useAcademicCycles } from "../../hooks/useAcademicCycles";
import {
  agruparNotasBoletin,
  crearDocumentoBoletin,
  etiquetaCondicionMateria,
  resumirBoletin,
} from "../../utils/exportadores/boletinPlanilla.js";

const badgeStyleForEstado = (estadoFinal) => {
  if (["APROBADA", "APROBADA_RECUPERACION"].includes(estadoFinal)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["DESAPROBADA", "A_RECUPERACION"].includes(estadoFinal)) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-slate-200 bg-canvas text-slate-600";
};

const formatNotaDisplay = (valor) => {
  if (valor === null || valor === undefined) {
    return <span className="text-slate-300">—</span>;
  }
  const num = Number(valor);
  const desaprobado = num < 6;
  return (
    <span className={`font-semibold tabular-nums ${desaprobado ? "text-red-600" : "text-navy"}`}>
      {num.toFixed(2)}
    </span>
  );
};

const Boletin = () => {
  const { usuario } = useAuth();
  const { cycles, cycleId, setCycleId, selectedCycle, loadingCycles } = useAcademicCycles();

  const [boletin, setBoletin] = useState([]);
  const [previas, setPrevias] = useState([]);
  const [asistencia, setAsistencia] = useState(null);
  const [alumnoReporte, setAlumnoReporte] = useState(null);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorReporte, setErrorReporte] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [errorPDF, setErrorPDF] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    let active = true;
    const cargarDatos = async () => {
      if (!cycleId) {
        if (!loadingCycles) setLoading(false);
        return;
      }

      setLoading(true);
      setErrorReporte("");
      setErrorPDF("");

      const results = await Promise.allSettled([
        getMisNotasAlumno(cycleId),
        getMisMateriasPrevias(),
        getMisAsistenciasAlumno(cycleId),
        getMisClasesAlumno(cycleId),
      ]);
      if (!active) return;

      const [notesResult, previasResult, attendanceResult, classesResult] = results;
      const notas = notesResult.status === "fulfilled" ? notesResult.value.data?.notas || [] : [];
      const materiasPrevias =
        previasResult.status === "fulfilled" && Array.isArray(previasResult.value.data)
          ? previasResult.value.data
          : [];
      const datosAsistencia =
        attendanceResult.status === "fulfilled" ? attendanceResult.value.data : null;
      const clasesAlumno =
        classesResult.status === "fulfilled" && Array.isArray(classesResult.value.data)
          ? classesResult.value.data
          : [];

      if (notesResult.status === "rejected") console.error("Error al cargar boletín:", notesResult.reason);
      if (previasResult.status === "rejected") console.error("Error al cargar previas:", previasResult.reason);
      if (attendanceResult.status === "rejected") console.error("Error al cargar asistencias:", attendanceResult.reason);
      if (classesResult.status === "rejected") console.error("Error al cargar clases del ciclo:", classesResult.reason);

      setBoletin(
        agruparNotasBoletin(
          notas,
          clasesAlumno.map((clase) => clase.materia).filter(Boolean),
          selectedCycle?.estado,
        ),
      );
      setPrevias(materiasPrevias);
      setAsistencia(datosAsistencia);
      setClases(clasesAlumno);
      setAlumnoReporte({
        ...usuario,
        ...(notesResult.status === "fulfilled" ? notesResult.value.data?.alumno : {}),
      });

      if (notesResult.status === "rejected") {
        setErrorReporte("No se pudieron cargar las calificaciones del ciclo seleccionado.");
      }
      setLoading(false);
    };

    cargarDatos();
    return () => {
      active = false;
    };
  }, [cycleId, loadingCycles, selectedCycle?.estado, usuario]);

  const alumnoVisible = useMemo(
    () => alumnoReporte || usuario || {},
    [alumnoReporte, usuario],
  );
  const primeraClase = clases[0];
  const cursoAnio = primeraClase?.nivel ?? primeraClase?.anio ?? alumnoVisible.anio;
  const cursoDivision = primeraClase?.division ?? alumnoVisible.division;
  const cursoTexto = cursoAnio
    ? `${cursoAnio}° Año${cursoDivision ? ` "${cursoDivision}"` : ""}`
    : "No informado";

  const resumen = useMemo(
    () =>
      resumirBoletin({
        materias: boletin,
        previas,
        nivel: cursoAnio,
        estadoCiclo: selectedCycle?.estado,
        estadoAcademico: alumnoVisible.estadoAcademico,
      }),
    [boletin, previas, cursoAnio, selectedCycle?.estado, alumnoVisible.estadoAcademico],
  );

  const previasPendientes = useMemo(
    () => previas.filter((previa) => previa.estado === "PENDIENTE"),
    [previas],
  );

  const documentoConstancia = useMemo(() => {
    if (!cycleId) return null;
    return crearDocumentoBoletin({
      alumno: alumnoVisible,
      ciclo: selectedCycle || {},
      curso: cursoAnio ? { anio: cursoAnio, division: cursoDivision } : {},
      materias: boletin,
      previas,
      asistencia,
    });
  }, [alumnoVisible, asistencia, boletin, cursoAnio, cursoDivision, cycleId, previas, selectedCycle]);

  const descargarConstanciaPDF = async () => {
    if (!documentoConstancia || generandoPDF) return;
    setGenerandoPDF(true);
    setErrorPDF("");
    try {
      const { exportarPDF } = await import("../../utils/exportadores/exportarPDF.js");
      await exportarPDF(documentoConstancia);
    } catch (error) {
      console.error("Error generando la Constancia Académica PDF:", error);
      setErrorPDF("No se pudo generar la Constancia Académica en PDF. Intenta nuevamente.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  const condicionColor =
    ["PROMOVIDO", "EGRESADO"].includes(resumen.condicionCodigo)
      ? "text-emerald-700"
      : ["REPITENTE", "BAJA"].includes(resumen.condicionCodigo)
        ? "text-red-700"
        : ["PROMOVIDO_CON_PREVIAS", "EGRESADO_CON_PREVIAS"].includes(resumen.condicionCodigo)
          ? "text-amber-800"
          : "text-secondary";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Encabezado de acciones */}
      <header className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
              <Award size={14} /> Registro Académico
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">
              Boletín de calificaciones
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Consulta tu rendimiento por trimestre y descarga tu Constancia Académica oficial en PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-56">
              <CycleSelector
                cycles={cycles}
                value={cycleId}
                onChange={setCycleId}
                disabled={loadingCycles}
                label="Ciclo lectivo"
              />
            </div>
            <button
              type="button"
              onClick={descargarConstanciaPDF}
              disabled={loading || !cycleId || Boolean(errorReporte) || generandoPDF}
              className="inline-flex h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
            >
              {generandoPDF ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileDown size={16} aria-hidden="true" />
                  Descargar Constancia Académica (PDF)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              disabled={loading || !cycleId || Boolean(errorReporte)}
              title="Previsualizar constancia o descargar en Word"
              className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-navy transition hover:border-blue-200 hover:bg-blue-50 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Vista previa</span>
            </button>
          </div>
        </div>
      </header>

      <CycleStatusNotice cycle={selectedCycle} />

      {(errorReporte || errorPDF) && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={17} className="shrink-0" />
          <span>{errorPDF || errorReporte}</span>
        </div>
      )}

      {/* Ficha del alumno */}
      <section aria-label="Ficha del alumno" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="space-y-2 rounded-xl bg-canvas p-3.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                <UserRound size={18} />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Estudiante</dt>
                <dd className="truncate text-sm font-bold text-navy">{alumnoVisible.nombre || "No informado"}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                <IdCard size={18} />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">DNI</dt>
                <dd className="truncate text-sm font-bold text-navy">{alumnoVisible.dni || "No informado"}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                <GraduationCap size={18} />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Curso / Año</dt>
                <dd className="truncate text-sm font-bold text-navy">{cursoTexto}</dd>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                <BookOpen size={18} />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Ciclo lectivo</dt>
                <dd className="truncate text-sm font-bold text-navy">
                  {selectedCycle?.nombre || "Sin ciclo"}
                </dd>
              </div>
            </div>
          </dl>
        )}
      </section>

      {/* Tarjetas resumen (KPIs) */}
      <section aria-label="Resumen de rendimiento" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Promedio general</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-navy">
            {loading ? <Skeleton className="h-9 w-20" /> : resumen.promedioGeneral === null ? "—" : resumen.promedioGeneral.toFixed(2)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Escala de 1 a 10 · Aprueba con ≥ 6</p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Aprobadas</p>
            <CheckCircle2 size={17} className="text-emerald-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-700">
            {loading ? <Skeleton className="h-9 w-14" /> : resumen.aprobadas}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            de {resumen.totalMaterias} materia{resumen.totalMaterias === 1 ? "" : "s"} del ciclo
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pendientes</p>
            <Clock size={17} className="text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-800">
            {loading ? <Skeleton className="h-9 w-14" /> : resumen.pendientesCiclo}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {previasPendientes.length > 0
              ? `+ ${previasPendientes.length} previa${previasPendientes.length === 1 ? "" : "s"} de ciclos anteriores`
              : "Hasta 4 promueve · 5+ repite"}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Condición académica</p>
          <p className={`mt-2 text-xl font-bold sm:text-2xl ${condicionColor}`}>
            {loading ? <Skeleton className="h-8 w-28" /> : resumen.condicionLabel}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {asistencia?.resumen?.porcentaje !== undefined
              ? `Asistencia: ${asistencia.resumen.porcentaje}%`
              : "Estado vigente del ciclo"}
          </p>
        </article>
      </section>

      {/* Tabla / Tarjetas de calificaciones */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-navy">Detalle de calificaciones</h2>
            <p className="text-xs text-slate-500">
              Promedio anual calculado con los tres trimestres completos (aprobación ≥ 6,00).
            </p>
          </div>
          {!loading && boletin.length > 0 && (
            <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-slate-600">
              {boletin.length} materia{boletin.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : boletin.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <AlertCircle size={38} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-navy">Aún no tienes calificaciones en este ciclo</p>
            <p className="mt-1 text-sm text-slate-500">
              Cuando tus docentes registren las notas trimestrales aparecerán aquí junto con tu promedio anual.
            </p>
          </div>
        ) : (
          <>
            {/* Vista Desktop (Tabla) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-navy text-xs font-bold uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-6 py-4">Materia</th>
                    <th className="px-4 py-4 text-center">1° Trim.</th>
                    <th className="px-4 py-4 text-center">2° Trim.</th>
                    <th className="px-4 py-4 text-center">3° Trim.</th>
                    <th className="px-4 py-4 text-center">Promedio</th>
                    <th className="px-6 py-4 text-center">Condición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {boletin.map((mat, idx) => (
                    <tr
                      key={mat.id}
                      className={`transition hover:bg-blue-50/40 ${idx % 2 ? "bg-canvas/50" : "bg-white"}`}
                    >
                      <td className="px-6 py-4 font-semibold text-navy">
                        {mat.nombre}
                        {mat.notaRecuperacion !== null && mat.notaRecuperacion !== undefined && (
                          <span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Recup: {Number(mat.notaRecuperacion).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">{formatNotaDisplay(mat.t1)}</td>
                      <td className="px-4 py-4 text-center">{formatNotaDisplay(mat.t2)}</td>
                      <td className="px-4 py-4 text-center">{formatNotaDisplay(mat.t3)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex min-w-[3.5rem] justify-center rounded-lg bg-blue-50 px-2.5 py-1 font-bold tabular-nums text-navy">
                          {mat.puntajeFinal === null ? "—" : mat.puntajeFinal.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyleForEstado(
                            mat.estadoFinal,
                          )}`}
                        >
                          {etiquetaCondicionMateria(mat.estadoFinal)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-blue-50/70">
                  <tr>
                    <td className="px-6 py-3.5 font-bold uppercase tracking-wide text-navy" colSpan={4}>
                      Promedio General
                    </td>
                    <td className="px-4 py-3.5 text-center font-extrabold tabular-nums text-navy">
                      {resumen.promedioGeneral === null ? "—" : resumen.promedioGeneral.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-secondary">
                      {resumen.condicionLabel}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Vista Mobile (Tarjetas) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {boletin.map((mat) => (
                <article key={mat.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-navy">{mat.nombre}</h3>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyleForEstado(
                        mat.estadoFinal,
                      )}`}
                    >
                      {etiquetaCondicionMateria(mat.estadoFinal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-canvas p-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">1° Trim</p>
                      <p className="mt-1 text-sm">{formatNotaDisplay(mat.t1)}</p>
                    </div>
                    <div className="rounded-xl bg-canvas p-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">2° Trim</p>
                      <p className="mt-1 text-sm">{formatNotaDisplay(mat.t2)}</p>
                    </div>
                    <div className="rounded-xl bg-canvas p-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">3° Trim</p>
                      <p className="mt-1 text-sm">{formatNotaDisplay(mat.t3)}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-2">
                      <p className="text-[10px] font-bold uppercase text-secondary">Prom.</p>
                      <p className="mt-1 text-sm font-bold tabular-nums text-navy">
                        {mat.puntajeFinal === null ? "—" : mat.puntajeFinal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {mat.notaRecuperacion !== null && mat.notaRecuperacion !== undefined && (
                    <p className="text-xs font-semibold text-amber-800">
                      Recuperación anual: {Number(mat.notaRecuperacion).toFixed(2)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Materias previas */}
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-950">
            <BookOpenCheck size={19} />
            Materias previas pendientes
          </h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
            {previasPendientes.length}
          </span>
        </div>

        {loading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-9 w-full" />
          </div>
        ) : previasPendientes.length === 0 ? (
          <p className="mt-2 text-sm text-amber-900/80">No registras materias previas pendientes de ciclos anteriores.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {previasPendientes.map((previa) => (
              <li
                key={previa._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/60 bg-white px-4 py-2.5 text-sm"
              >
                <span className="font-semibold text-navy">{previa.materia}</span>
                <span className="text-xs font-semibold text-amber-800">
                  {previa.nivelOrigen}° Año · Ciclo {previa.anioOrigen} · Pendiente
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalExportarPlanilla
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        documento={documentoConstancia}
      />
    </div>
  );
};

export default Boletin;
