import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { LOGO_COLEGIO_URL } from "../utils/exportadores/logoHelper.js";
import {
  normalizarDocumento,
  obtenerValorCelda,
  textoCelda,
} from "../utils/exportadores/planillaUtils.js";

const ModalExportarPlanilla = ({ abierto, onCerrar, documento }) => {
  const [exportandoFormato, setExportandoFormato] = useState("");
  const [errorExportacion, setErrorExportacion] = useState("");
  const [masOpcionesAbierto, setMasOpcionesAbierto] = useState(false);

  // Opciones avanzadas opcionales (colapsadas por defecto en el acordeón)
  const [orientacionPersonalizada, setOrientacionPersonalizada] = useState("");
  const [nombrePersonalizado, setNombrePersonalizado] = useState("");
  const [incluirFirmas, setIncluirFirmas] = useState(true);

  const planillaBase = useMemo(() => {
    if (!abierto || !documento) return null;
    return normalizarDocumento(documento);
  }, [abierto, documento]);

  useEffect(() => {
    if (!abierto) return;
    setErrorExportacion("");
    setMasOpcionesAbierto(false);
    setOrientacionPersonalizada("");
    setNombrePersonalizado("");
    setIncluirFirmas(true);
  }, [abierto, documento]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [abierto, onCerrar]);

  if (!abierto || !planillaBase) return null;

  const planilla = normalizarDocumento({
    ...documento,
    orientacion: orientacionPersonalizada || planillaBase.orientacion,
    nombreArchivo: nombrePersonalizado.trim() || planillaBase.nombreArchivo,
    firmas: incluirFirmas ? planillaBase.firmas : [],
  });

  const columnasVisibles = planilla.columnas.filter((columna) => !columna.soloExcel);
  const exportando = Boolean(exportandoFormato);
  const formatoRapidoEditable = planilla.formatosEditables.includes("excel")
    ? "excel"
    : planilla.formatosEditables[0] || null;
  const otrosFormatosEditables = planilla.formatosEditables.filter(
    (formato) => formato !== formatoRapidoEditable,
  );

  const exportarEditable = async (formato) => {
    setExportandoFormato(formato);
    setErrorExportacion("");
    try {
      if (formato === "word") {
        const { exportarWord } = await import("../utils/exportadores/exportarWord.js");
        await exportarWord(planilla);
      } else {
        const { exportarExcel } = await import("../utils/exportadores/exportarExcel.js");
        await exportarExcel(planilla);
      }
    } catch (error) {
      console.error("No se pudo exportar la planilla editable:", error);
      setErrorExportacion("No se pudo generar el documento editable. Intenta nuevamente.");
    } finally {
      setExportandoFormato("");
    }
  };

  const exportarPDFActual = async () => {
    setExportandoFormato("pdf");
    setErrorExportacion("");
    try {
      const { exportarPDF } = await import("../utils/exportadores/exportarPDF.js");
      await exportarPDF(planilla);
    } catch (error) {
      console.error("No se pudo exportar la planilla PDF:", error);
      setErrorExportacion("No se pudo generar el PDF. Intenta nuevamente.");
    } finally {
      setExportandoFormato("");
    }
  };

  const imprimirPlanilla = () => {
    const limpiarModoImpresion = () => document.body.classList.remove("imprimiendo-planilla");
    document.body.classList.add("imprimiendo-planilla");
    window.addEventListener("afterprint", limpiarModoImpresion, { once: true });
    window.print();
  };

  return createPortal(
    <div
      className="planilla-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-navy/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-exportar-planilla-title"
        className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Barra rápida de 1 clic: PDF + Excel (o formato principal) + acordeón "Más opciones" */}
        <div className="planilla-no-print border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="modal-exportar-planilla-title" className="truncate font-bold text-navy">
                Exportar planilla
              </h2>
              <p className="text-xs text-slate-500">
                A4 · {planilla.orientacion === "landscape" ? "Horizontal" : "Vertical"} · {planilla.nombreArchivo}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportarPDFActual}
                disabled={exportando}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                {exportandoFormato === "pdf" ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <FileText size={16} aria-hidden="true" />
                )}
                Descargar PDF
              </button>

              {formatoRapidoEditable && (
                <button
                  type="button"
                  onClick={() => exportarEditable(formatoRapidoEditable)}
                  disabled={exportando}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy transition hover:border-blue-200 hover:bg-blue-50 hover:text-secondary disabled:cursor-wait disabled:opacity-60"
                >
                  {exportandoFormato === formatoRapidoEditable ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : formatoRapidoEditable === "word" ? (
                    <FileText size={16} aria-hidden="true" />
                  ) : (
                    <FileSpreadsheet size={16} aria-hidden="true" />
                  )}
                  Descargar {formatoRapidoEditable === "word" ? "Word" : "Excel"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setMasOpcionesAbierto((prev) => !prev)}
                aria-expanded={masOpcionesAbierto}
                aria-controls="modal-exportar-mas-opciones"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  masOpcionesAbierto
                    ? "border-blue-200 bg-blue-50 text-secondary"
                    : "border-slate-200 bg-canvas text-slate-600 hover:bg-slate-100 hover:text-navy"
                }`}
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Más opciones
                {masOpcionesAbierto ? (
                  <ChevronUp size={14} aria-hidden="true" />
                ) : (
                  <ChevronDown size={14} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={onCerrar}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-accent"
                title="Cerrar"
                aria-label="Cerrar vista previa"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Acordeón de opciones avanzadas */}
          {masOpcionesAbierto && (
            <div
              id="modal-exportar-mas-opciones"
              className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-canvas p-3.5 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Nombre de archivo
                </label>
                <input
                  type="text"
                  value={nombrePersonalizado}
                  onChange={(event) => setNombrePersonalizado(event.target.value)}
                  placeholder={planillaBase.nombreArchivo}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-navy outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Orientación de página
                </label>
                <select
                  value={orientacionPersonalizada || planillaBase.orientacion}
                  onChange={(event) => setOrientacionPersonalizada(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-navy outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="portrait">Vertical (A4)</option>
                  <option value="landscape">Horizontal (A4)</option>
                </select>
              </div>

              {planillaBase.firmas.length > 0 && (
                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy">
                    <input
                      type="checkbox"
                      checked={incluirFirmas}
                      onChange={(event) => setIncluirFirmas(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-blue-200"
                    />
                    Incluir espacio de firmas
                  </label>
                </div>
              )}

              <div className="flex flex-wrap items-end justify-end gap-2">
                {otrosFormatosEditables.map((formato) => (
                  <button
                    key={formato}
                    type="button"
                    onClick={() => exportarEditable(formato)}
                    disabled={exportando}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-blue-50 hover:text-secondary disabled:opacity-50"
                  >
                    {formato === "word" ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
                    {formato === "word" ? "Word" : "Excel"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={imprimirPlanilla}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-blue-50 hover:text-secondary"
                >
                  <Printer size={14} aria-hidden="true" />
                  Imprimir
                </button>
              </div>
            </div>
          )}
        </div>

        {errorExportacion && (
          <p className="planilla-no-print border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
            {errorExportacion}
          </p>
        )}

        <div className="planilla-preview-scroll max-h-[78vh] overflow-auto bg-slate-100 p-3 sm:p-6">
          <article
            className="planilla-print-area mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white p-[14mm] text-slate-800 shadow-lg"
            data-orientation={planilla.orientacion}
            style={planilla.orientacion === "landscape" ? { maxWidth: "297mm", minHeight: "210mm" } : undefined}
          >
            <header className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 border-b-2 border-secondary pb-3">
              <img src={LOGO_COLEGIO_URL} alt="Logo Colegio Reina de la Esperanza" className="h-16 w-16 object-contain" />
              <div className="min-w-0 text-center">
                <p className="text-sm font-extrabold text-navy sm:text-base">Colegio Reina de la Esperanza</p>
                <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">{planilla.subtitulo}</p>
                <h1 className="mt-2 text-sm font-bold uppercase tracking-wide text-navy sm:text-base">{planilla.titulo}</h1>
              </div>
              <div className="text-right text-[10px] leading-relaxed text-slate-600 sm:text-xs">
                <p><strong>Ciclo:</strong> {planilla.cicloLectivo}</p>
                <p><strong>Emisión:</strong> {planilla.fechaEmision}</p>
                <p><strong>Página:</strong> Vista previa</p>
              </div>
            </header>

            {planilla.contexto.length > 0 && (
              <dl className="my-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                {planilla.contexto.map((item, index) => (
                  <div key={`${item.etiqueta}-${index}`} className="rounded border border-slate-200 bg-canvas px-3 py-2">
                    <dt className="inline font-semibold text-navy">{item.etiqueta}: </dt>
                    <dd className="inline text-slate-700">{textoCelda(item.valor)}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px] sm:text-xs">
                <thead>
                  <tr className="bg-navy text-white">
                    {columnasVisibles.map((columna, index) => (
                      <th key={`${columna.titulo}-${index}`} className="border border-slate-500 px-2 py-2 text-left font-semibold">
                        {columna.titulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilla.filas.map((fila, rowIndex) => (
                    <tr
                      key={fila?.id || rowIndex}
                      className={
                        fila?.esResumen
                          ? "bg-blue-50/80 font-bold text-navy"
                          : rowIndex % 2
                            ? "bg-canvas"
                            : "bg-white"
                      }
                    >
                      {columnasVisibles.map((columna, columnIndex) => {
                        const rawVal = obtenerValorCelda(fila, columna, columnIndex);
                        const cellText = fila?.esResumen && (rawVal === "" || rawVal === null || rawVal === undefined)
                          ? ""
                          : textoCelda(rawVal);
                        return (
                          <td key={`${columna.titulo}-${columnIndex}`} className="border border-slate-300 px-2 py-1.5">
                            {cellText}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {planilla.secciones.map((seccion, sectionIndex) => (
              <section key={`${seccion.titulo}-${sectionIndex}`} className="mt-5 break-inside-avoid">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-navy">{seccion.titulo}</h2>
                {seccion.columnas.length > 0 && seccion.filas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[10px] sm:text-xs">
                      <thead>
                        <tr className="bg-navy text-white">
                          {seccion.columnas.map((columna, index) => (
                            <th key={`${columna.titulo}-${index}`} className="border border-slate-500 px-2 py-2 text-left font-semibold">
                              {columna.titulo}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {seccion.filas.map((fila, rowIndex) => (
                          <tr key={fila?._id || rowIndex} className={rowIndex % 2 ? "bg-canvas" : "bg-white"}>
                            {seccion.columnas.map((columna, columnIndex) => (
                              <td key={`${columna.titulo}-${columnIndex}`} className="border border-slate-300 px-2 py-1.5">
                                {textoCelda(obtenerValorCelda(fila, columna, columnIndex))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : seccion.tipo === "observaciones" ? (
                  <div className="min-h-20 rounded border border-slate-200 px-3 py-2 text-xs text-slate-600">
                    {seccion.contenido}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">{seccion.contenido}</p>
                )}
              </section>
            ))}

            {planilla.firmas.length > 0 && (
              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
                {planilla.firmas.slice(0, 3).map((firma) => (
                  <div key={firma} className="border-t border-dashed border-slate-400 pt-2 text-center text-xs text-slate-600">
                    {firma}
                  </div>
                ))}
              </div>
            )}

            <footer className="mt-8 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-500">
              {planilla.pie}
            </footer>
          </article>
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default ModalExportarPlanilla;
