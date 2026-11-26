import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fileSaver from "file-saver";
import { obtenerLogoColegio } from "./logoHelper.js";
import {
  coloresPlanilla,
  normalizarDocumento,
  obtenerValorCelda,
  textoCelda,
} from "./planillaUtils.js";

const guardarArchivo = fileSaver.saveAs || fileSaver;

const drawHeader = (pdf, documento, logo) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  const logoWidth = 19;
  const logoHeight = logoWidth * (logo.alto / logo.ancho);

  pdf.addImage(logo.dataUrl, "PNG", margin, 9, logoWidth, logoHeight);
  pdf.setTextColor(`#${coloresPlanilla.navy}`);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Colegio Reina de la Esperanza", pageWidth / 2, 13, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(documento.subtitulo, pageWidth / 2, 18, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.text(documento.titulo, pageWidth / 2, 26, { align: "center", maxWidth: pageWidth - 68 });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(`Ciclo lectivo: ${documento.cicloLectivo}`, pageWidth - margin, 12, { align: "right" });
  pdf.text(`Emisión: ${documento.fechaEmision}`, pageWidth - margin, 17, { align: "right" });
  pdf.setDrawColor(`#${coloresPlanilla.primario}`);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 34, pageWidth - margin, 34);
};

const drawContext = (pdf, contexto, pageWidth) => {
  if (contexto.length === 0) return 39;
  const margin = 14;
  const columns = 2;
  const gap = 4;
  const cellWidth = (pageWidth - margin * 2 - gap) / columns;
  const rows = Math.ceil(contexto.length / columns);
  const cellHeight = 7;

  contexto.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = margin + column * (cellWidth + gap);
    const y = 38 + row * (cellHeight + 2);
    pdf.setFillColor(`#${coloresPlanilla.canvas}`);
    pdf.setDrawColor(`#${coloresPlanilla.borde}`);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(x, y, cellWidth, cellHeight, 1, 1, "FD");
    pdf.setFontSize(7.2);
    pdf.setTextColor(`#${coloresPlanilla.navy}`);
    pdf.setFont("helvetica", "bold");
    const label = `${item.etiqueta}: `;
    pdf.text(label, x + 2.2, y + 4.6);
    const labelWidth = pdf.getTextWidth(label) + 1;
    pdf.setTextColor(`#${coloresPlanilla.texto}`);
    pdf.setFont("helvetica", "normal");
    pdf.text(textoCelda(item.valor), x + 2.2 + labelWidth, y + 4.6, {
      maxWidth: Math.max(10, cellWidth - labelWidth - 4.4),
    });
  });

  return 38 + rows * (cellHeight + 2) + 3;
};

const drawSignatures = (pdf, firmas, startY) => {
  if (firmas.length === 0) return;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const columns = Math.min(3, firmas.length);
  const gap = 8;
  const cellWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;
  const rowCount = Math.ceil(firmas.length / columns);
  const blockHeight = rowCount * 22;
  let y = startY + 14;
  if (y + blockHeight > pageHeight - 23) {
    pdf.addPage();
    y = 50;
  }

  firmas.forEach((firma, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = margin + column * (cellWidth + gap);
    const lineY = y + row * 22;
    pdf.setDrawColor(`#${coloresPlanilla.borde}`);
    pdf.setLineWidth(0.35);
    for (let point = 0; point < cellWidth; point += 2.2) {
      pdf.line(x + point, lineY, Math.min(x + point + 0.8, x + cellWidth), lineY);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(`#${coloresPlanilla.navy}`);
    pdf.text(firma, x + cellWidth / 2, lineY + 4.5, { align: "center", maxWidth: cellWidth });
  });
};

export const exportarPDF = async (configuracion) => {
  const documento = normalizarDocumento(configuracion);
  const columnas = documento.columnas.filter((columna) => !columna.soloExcel);
  const logo = await obtenerLogoColegio();
  const pdf = new jsPDF({
    orientation: documento.orientacion,
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const startY = drawContext(pdf, documento.contexto, pdf.internal.pageSize.getWidth());
  const headFillColor = documento.estiloEncabezadoTabla === "oscuro"
    ? [16, 35, 63]
    : [25, 60, 184];

  autoTable(pdf, {
    head: [columnas.map((columna) => columna.titulo)],
    body: documento.filas.map((fila) =>
      columnas.map((columna, index) => {
        const value = obtenerValorCelda(fila, columna, index);
        if (fila?.esResumen && (value === "" || value === null || value === undefined)) return "";
        return textoCelda(value);
      }),
    ),
    startY,
    margin: { top: 39, right: 14, bottom: 23, left: 14 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [52, 64, 84],
      lineColor: [215, 223, 234],
      lineWidth: 0.15,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: headFillColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [247, 248, 252] },
    columnStyles: Object.fromEntries(columnas.map((columna, index) => [
      index,
      {
        ...(columna.alineacion ? { halign: columna.alineacion } : {}),
        ...(columna.ancho ? { cellWidth: columna.ancho } : {}),
      },
    ])),
    didParseCell: (data) => {
      if (data.section === "body" && documento.filas[data.row.index]?.esResumen) {
        data.cell.styles.fillColor = [235, 242, 255];
        data.cell.styles.textColor = [16, 35, 63];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  let contentY = pdf.lastAutoTable?.finalY || startY;
  for (const section of documento.secciones) {
    if (!section.columnas.length && !section.contenido && section.tipo !== "observaciones") continue;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (contentY + 18 > pageHeight - 23) {
      pdf.addPage();
      contentY = 43;
    } else {
      contentY += 6;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(`#${coloresPlanilla.navy}`);
    pdf.text(section.titulo, 14, contentY + 4);
    contentY += 7;

    if (section.columnas.length && section.filas.length) {
      autoTable(pdf, {
        head: [section.columnas.map((columna) => columna.titulo)],
        body: section.filas.map((fila) =>
          section.columnas.map((columna, index) => textoCelda(obtenerValorCelda(fila, columna, index))),
        ),
        startY: contentY,
        margin: { top: 39, right: 14, bottom: 23, left: 14 },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 7.5,
          cellPadding: 1.8,
          textColor: [52, 64, 84],
          lineColor: [215, 223, 234],
          lineWidth: 0.15,
        },
        headStyles: { fillColor: headFillColor, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [247, 248, 252] },
        columnStyles: Object.fromEntries(section.columnas.map((columna, index) => [
          index,
          columna.alineacion ? { halign: columna.alineacion } : {},
        ])),
      });
      contentY = pdf.lastAutoTable?.finalY || contentY;
    } else if (section.tipo === "observaciones") {
      const boxHeight = 18;
      if (contentY + boxHeight > pageHeight - 23) {
        pdf.addPage();
        contentY = 43;
      }
      pdf.setDrawColor(`#${coloresPlanilla.borde}`);
      pdf.setLineWidth(0.25);
      pdf.rect(14, contentY, pageWidth - 28, boxHeight);
      if (section.contenido) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(`#${coloresPlanilla.texto}`);
        pdf.text(section.contenido, 16, contentY + 5, { maxWidth: pageWidth - 32 });
      }
      contentY += boxHeight;
    } else if (section.tipo === "parrafo") {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.2);
      const lines = pdf.splitTextToSize(String(section.contenido || ""), pageWidth - 34);
      const lineHeight = 4.2;
      const boxHeight = Math.max(12, lines.length * lineHeight + 6);
      if (contentY + boxHeight > pageHeight - 23) {
        pdf.addPage();
        contentY = 43;
      }
      pdf.setFillColor(`#${coloresPlanilla.canvas}`);
      pdf.setDrawColor(`#${coloresPlanilla.borde}`);
      pdf.setLineWidth(0.25);
      pdf.roundedRect(14, contentY, pageWidth - 28, boxHeight, 1.5, 1.5, "FD");
      pdf.setTextColor(`#${coloresPlanilla.texto}`);
      pdf.text(lines, 17, contentY + 5.2);
      contentY += boxHeight;
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      const lines = pdf.splitTextToSize(String(section.contenido || ""), pageWidth - 28);
      pdf.setTextColor(`#${coloresPlanilla.texto}`);
      pdf.text(lines, 14, contentY + 3.5);
      contentY += Math.max(7, lines.length * 4 + 3);
    }
  }

  drawSignatures(pdf, documento.firmas, contentY);

  const pageCount = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    drawHeader(pdf, documento, logo);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setDrawColor(`#${coloresPlanilla.borde}`);
    pdf.setLineWidth(0.25);
    pdf.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(`#${coloresPlanilla.texto}`);
    pdf.text(documento.pie, 14, pageHeight - 11, { maxWidth: pageWidth - 55 });
    pdf.text(`Página ${page} de ${pageCount}`, pageWidth - 14, pageHeight - 11, { align: "right" });
  }

  const blob = pdf.output("blob");
  guardarArchivo(blob, `${documento.nombreArchivo}.pdf`);
  return blob;
};
