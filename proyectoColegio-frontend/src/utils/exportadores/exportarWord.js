import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  PageNumber,
  PageOrientation,
  Paragraph,
  Packer,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import fileSaver from "file-saver";
import { obtenerLogoColegio } from "./logoHelper.js";
import {
  coloresPlanilla,
  normalizarDocumento,
  obtenerValorCelda,
  textoCelda,
} from "./planillaUtils.js";

const guardarArchivo = fileSaver.saveAs || fileSaver;
const border = { style: BorderStyle.SINGLE, size: 3, color: coloresPlanilla.borde, space: 0 };
const tableBorders = {
  top: border,
  bottom: border,
  left: border,
  right: border,
  insideHorizontal: border,
  insideVertical: border,
};

const paragraph = (text, options = {}) => new Paragraph({
  alignment: options.alignment || AlignmentType.LEFT,
  spacing: { before: 0, after: options.after ?? 80 },
  children: [new TextRun({
    text: String(text ?? ""),
    bold: Boolean(options.bold),
    color: options.color || coloresPlanilla.texto,
    size: options.size || 18,
  })],
});

const cell = (text, options = {}) => new TableCell({
  width: { size: options.width || 100, type: WidthType.PERCENTAGE },
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  ...(options.fill ? { shading: { type: ShadingType.CLEAR, color: "FFFFFF", fill: options.fill } } : {}),
  children: [paragraph(text, {
    bold: options.bold,
    color: options.color || coloresPlanilla.texto,
    alignment: options.alignment,
    size: options.size,
    after: 0,
  })],
});

const makeHeader = (documento, logo) => {
  const logoCell = new TableCell({
    width: { size: 16, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({
        data: new Uint8Array(logo.arrayBuffer),
        transformation: { width: 58, height: 58 },
      })],
    })],
  });
  const institutionCell = new TableCell({
    width: { size: 58, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      paragraph("Colegio Reina de la Esperanza", { bold: true, color: coloresPlanilla.navy, size: 24 }),
      paragraph(documento.subtitulo, { size: 16 }),
      paragraph(documento.titulo, { bold: true, color: coloresPlanilla.navy, size: 20, after: 0 }),
    ],
  });
  const metadataCell = new TableCell({
    width: { size: 26, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      paragraph(`Ciclo lectivo: ${documento.cicloLectivo}`, { bold: true, size: 16 }),
      paragraph(`Emisión: ${documento.fechaEmision}`, { size: 16 }),
    ],
  });

  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1600, 5800, 2600],
        rows: [new TableRow({ children: [logoCell, institutionCell, metadataCell] })],
        borders: tableBorders,
      }),
      new Paragraph({
        border: { bottom: { color: coloresPlanilla.primario, style: BorderStyle.SINGLE, size: 8, space: 1 } },
        spacing: { after: 140 },
        children: [new TextRun("")],
      }),
    ],
  });
};

const makeContextTable = (contexto) => {
  if (contexto.length === 0) return [];
  const rows = [];
  for (let index = 0; index < contexto.length; index += 2) {
    const left = contexto[index];
    const right = contexto[index + 1];
    rows.push(new TableRow({
      children: [
        cell(`${left.etiqueta}: ${textoCelda(left.valor)}`, { fill: coloresPlanilla.canvas }),
        cell(right ? `${right.etiqueta}: ${textoCelda(right.valor)}` : "", { fill: coloresPlanilla.canvas }),
      ],
    }));
  }
  return [
    new Paragraph({ children: [new TextRun({ text: "Datos del documento", bold: true, color: coloresPlanilla.navy, size: 18 })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [5000, 5000],
      rows,
      borders: tableBorders,
    }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] }),
  ];
};

const makeDataTable = (documento) => {
  const columnas = documento.columnas.filter((columna) => !columna.soloExcel);
  if (columnas.length === 0) return [];
  const totalWidth = columnas.reduce((total, columna) => total + (Number(columna.ancho) || 1), 0);
  const columnWidths = columnas.map((columna) =>
    Math.floor(((Number(columna.ancho) || 1) / totalWidth) * 10000),
  );
  columnWidths[columnWidths.length - 1] = 10000 - columnWidths
    .slice(0, -1)
    .reduce((total, width) => total + width, 0);
  const header = new TableRow({
    tableHeader: true,
    children: columnas.map((columna) => cell(columna.titulo, {
      fill: coloresPlanilla.primario,
      color: "FFFFFF",
      bold: true,
      alignment: AlignmentType.CENTER,
    })),
  });
  const rows = documento.filas.map((fila, rowIndex) => new TableRow({
    children: columnas.map((columna, columnIndex) => cell(
      textoCelda(obtenerValorCelda(fila, columna, columnIndex)),
      {
        fill: rowIndex % 2 ? "F7F8FC" : "FFFFFF",
        alignment: columna.alineacion === "center"
          ? AlignmentType.CENTER
          : columna.alineacion === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
      },
    )),
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths,
    rows: [header, ...rows],
    borders: tableBorders,
  })];
};

const makeSectionTable = (seccion) => {
  const totalWidth = seccion.columnas.reduce((total, columna) => total + (Number(columna.ancho) || 1), 0);
  const columnWidths = seccion.columnas.map((columna) =>
    Math.floor(((Number(columna.ancho) || 1) / totalWidth) * 10000),
  );
  columnWidths[columnWidths.length - 1] = 10000 - columnWidths
    .slice(0, -1)
    .reduce((total, width) => total + width, 0);
  const header = new TableRow({
    tableHeader: true,
    children: seccion.columnas.map((columna) => cell(columna.titulo, {
      fill: coloresPlanilla.primario,
      color: "FFFFFF",
      bold: true,
      alignment: AlignmentType.CENTER,
    })),
  });
  const rows = seccion.filas.map((fila, rowIndex) => new TableRow({
    children: seccion.columnas.map((columna, columnIndex) => cell(
      textoCelda(obtenerValorCelda(fila, columna, columnIndex)),
      { fill: rowIndex % 2 ? "F7F8FC" : "FFFFFF" },
    )),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths,
    rows: [header, ...rows],
    borders: tableBorders,
  });
};

const makeAdditionalSections = (secciones) => secciones.flatMap((seccion) => {
  const content = [
    new Paragraph({
      spacing: { before: 180, after: 80 },
      children: [new TextRun({ text: seccion.titulo, bold: true, color: coloresPlanilla.navy, size: 18 })],
    }),
  ];

  if (seccion.columnas.length && seccion.filas.length) {
    content.push(makeSectionTable(seccion));
  } else if (seccion.tipo === "observaciones") {
    content.push(...Array.from({ length: 3 }, () => new Paragraph({
      spacing: { after: 160 },
      border: {
        bottom: { color: coloresPlanilla.borde, style: BorderStyle.DOTTED, size: 4, space: 2 },
      },
      children: [new TextRun(" ")],
    })));
  } else if (seccion.contenido) {
    content.push(paragraph(seccion.contenido, { size: 16 }));
  }

  return content;
});

const makeSignatures = (firmas) => {
  if (firmas.length === 0) return [];
  const cells = firmas.slice(0, 3).map((firma) => cell(`____________________________\n${firma}`, {
    alignment: AlignmentType.CENTER,
    size: 16,
  }));
  while (cells.length < 3) cells.push(cell(""));
  return [
    new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun("")] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [3333, 3333, 3334],
      rows: [new TableRow({ children: cells })],
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
    }),
  ];
};

export const exportarWord = async (configuracion) => {
  const documento = normalizarDocumento(configuracion);
  const logo = await obtenerLogoColegio();
  const section = {
    properties: {
      page: {
        size: {
          width: 11906,
          height: 16838,
          ...(documento.orientacion === "landscape" ? { orientation: PageOrientation.LANDSCAPE } : {}),
        },
        margin: { top: 1800, right: 850, bottom: 1200, left: 850 },
      },
    },
    headers: { default: makeHeader(documento, logo) },
    footers: {
      default: new Footer({
        children: [
          paragraph(documento.pie, { alignment: AlignmentType.CENTER, size: 14, after: 40 }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "Página ", size: 14, color: coloresPlanilla.texto }),
              new TextRun({ children: [PageNumber.CURRENT], size: 14, color: coloresPlanilla.texto }),
              new TextRun({ text: " de ", size: 14, color: coloresPlanilla.texto }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: coloresPlanilla.texto }),
            ],
          }),
        ],
      }),
    },
    children: [
      ...makeContextTable(documento.contexto),
      ...makeDataTable(documento),
      ...makeAdditionalSections(documento.secciones),
      ...makeSignatures(documento.firmas),
    ],
  };
  const file = await Packer.toBlob(new Document({
    creator: "Sistema de Gestión Escolar",
    title: documento.titulo,
    sections: [section],
  }));

  guardarArchivo(file, `${documento.nombreArchivo}.docx`);
  return file;
};
