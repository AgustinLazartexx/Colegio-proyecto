import ExcelJS from "exceljs";
import fileSaver from "file-saver";
import { obtenerLogoColegio } from "./logoHelper.js";
import {
  coloresPlanilla,
  normalizarDocumento,
  obtenerValorCelda,
  textoCelda,
} from "./planillaUtils.js";

const guardarArchivo = fileSaver.saveAs || fileSaver;
const excelColumn = (number) => {
  let column = "";
  let current = number;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
};

const formulaParaFila = (formula, rowNumber, row, columnIndex) => {
  if (typeof formula === "function") return String(formula(rowNumber, row, columnIndex)).replace(/^=/, "");
  return String(formula).replaceAll("{fila}", String(rowNumber)).replace(/^=/, "");
};

export const exportarExcel = async (configuracion) => {
  const documento = normalizarDocumento(configuracion);
  const logo = await obtenerLogoColegio();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Gestión Escolar";
  workbook.subject = documento.titulo;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(documento.titulo.slice(0, 31), {
    pageSetup: {
      paperSize: 9,
      orientation: documento.orientacion,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 },
    },
  });
  worksheet.properties.defaultRowHeight = 20;
  worksheet.columns = documento.columnas.map((columna) => ({
    key: columna.clave,
    width: columna.ancho || Math.max(12, Math.min(28, columna.titulo.length + 4)),
    hidden: Boolean(columna.soloExcel),
    style: {
      alignment: {
        vertical: "middle",
        horizontal: columna.alineacion || "left",
        wrapText: true,
      },
      ...(columna.numFmt ? { numFmt: columna.numFmt } : {}),
    },
  }));
  if (worksheet.columns.length > 0) {
    worksheet.getColumn(1).width = Math.max(14, worksheet.getColumn(1).width);
  }
  for (let row = 1; row <= 4; row += 1) worksheet.getRow(row).height = 20;

  const totalColumns = Math.max(documento.columnas.length, 2);
  for (let row = 1; row <= 4; row += 1) {
    worksheet.mergeCells(row, 2, row, totalColumns);
  }
  worksheet.getCell("B1").value = "Colegio Reina de la Esperanza";
  worksheet.getCell("B1").font = { name: "Arial", size: 16, bold: true, color: { argb: `FF${coloresPlanilla.navy}` } };
  worksheet.getCell("B2").value = documento.subtitulo;
  worksheet.getCell("B2").font = { name: "Arial", size: 10, color: { argb: `FF${coloresPlanilla.texto}` } };
  worksheet.getCell("B3").value = documento.titulo;
  worksheet.getCell("B3").font = { name: "Arial", size: 13, bold: true, color: { argb: `FF${coloresPlanilla.navy}` } };
  worksheet.getCell("B4").value = `Ciclo lectivo: ${documento.cicloLectivo}    ·    Emisión: ${documento.fechaEmision}`;
  worksheet.getCell("B4").font = { name: "Arial", size: 9, color: { argb: `FF${coloresPlanilla.texto}` } };
  worksheet.addImage(workbook.addImage({
    buffer: new Uint8Array(logo.arrayBuffer),
    extension: "png",
  }), {
    tl: { col: 0.05, row: 0.05 },
    ext: { width: 64, height: 64 },
  });

  const contextRow = 5;
  worksheet.mergeCells(contextRow, 1, contextRow, totalColumns);
  worksheet.getRow(contextRow).height = 28;
  worksheet.getCell(contextRow, 1).value = documento.contexto
    .map(({ etiqueta, valor }) => `${etiqueta}: ${textoCelda(valor)}`)
    .join("    ·    ");
  worksheet.getCell(contextRow, 1).alignment = { vertical: "middle", wrapText: true };
  worksheet.getCell(contextRow, 1).font = { name: "Arial", size: 9, color: { argb: `FF${coloresPlanilla.texto}` } };

  const headerRowNumber = 7;
  const headerRow = worksheet.getRow(headerRowNumber);
  documento.columnas.forEach((columna, index) => {
    const headerCell = headerRow.getCell(index + 1);
    headerCell.value = columna.titulo;
    headerCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${coloresPlanilla.primario}` } };
    headerCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerCell.border = { bottom: { style: "thin", color: { argb: `FF${coloresPlanilla.borde}` } } };
  });
  headerRow.height = 30;

  const firstDataRow = headerRowNumber + 1;
  documento.filas.forEach((fila, rowIndex) => {
    const rowNumber = firstDataRow + rowIndex;
    const row = worksheet.getRow(rowNumber);
    documento.columnas.forEach((columna, columnIndex) => {
      const currentCell = row.getCell(columnIndex + 1);
      if (columna.formula) {
        currentCell.value = { formula: formulaParaFila(columna.formula, rowNumber, fila, columnIndex) };
      } else {
        currentCell.value = obtenerValorCelda(fila, columna, columnIndex) ?? null;
      }
      currentCell.alignment = {
        vertical: "middle",
        horizontal: columna.alineacion || "left",
        wrapText: true,
      };
      currentCell.border = { bottom: { style: "hair", color: { argb: `FF${coloresPlanilla.borde}` } } };
      if (rowIndex % 2 === 1) {
        currentCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${coloresPlanilla.canvas}` } };
      }
    });
  });

  const lastDataRow = firstDataRow + documento.filas.length - 1;
  documento.columnas.forEach((columna, index) => {
    if (!columna.formatoCondicional || documento.filas.length === 0) return;
    const columnName = excelColumn(index + 1);
    const condition = columna.formatoCondicional;
    worksheet.addConditionalFormatting({
      ref: `${columnName}${firstDataRow}:${columnName}${lastDataRow}`,
      rules: [{
        type: "cellIs",
        operator: condition.operador || "lessThan",
        formulae: [condition.valor ?? 18],
        style: {
          font: { color: { argb: `FF${condition.colorTexto || "B42318"}` }, bold: true },
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: `FF${condition.colorFondo || "FEF3F2"}` } },
        },
      }],
    });
  });

  if (documento.columnas.length > 0) {
    worksheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: documento.columnas.length },
    };
    worksheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  }

  let signatureRow = Math.max(firstDataRow + documento.filas.length + 1, headerRowNumber + 2);
  for (const firma of documento.firmas) {
    worksheet.mergeCells(signatureRow, 1, signatureRow, totalColumns);
    worksheet.getCell(signatureRow, 1).value = `________________________________________    ${firma}`;
    worksheet.getCell(signatureRow, 1).font = { name: "Arial", size: 10, color: { argb: `FF${coloresPlanilla.texto}` } };
    worksheet.getRow(signatureRow).height = 28;
    signatureRow += 1;
  }

  worksheet.headerFooter.oddFooter = `&L${documento.pie}&RPage &P of &N`;
  worksheet.printArea = `A1:${excelColumn(totalColumns)}${Math.max(signatureRow, lastDataRow)}`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  guardarArchivo(blob, `${documento.nombreArchivo}.xlsx`);
  return blob;
};
