import { formatearFecha } from "./planillaUtils.js";

const asNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const gradeFor = (notes, period, studentId) =>
  asNumberOrNull(notes?.[period]?.[studentId]?.notaFinalTrimestre);

const statusLabel = (status) => ({
  A_RECUPERACION: "A RECUPERACIÓN",
  APROBADA_RECUPERACION: "APROBADA RECUPERACIÓN",
}[status] || String(status || "").replaceAll("_", " ") || "INCOMPLETA");

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

const attendanceCode = (status) => ({
  presente: "P",
  ausente: "A",
  tarde: "T",
  justificado: "J",
}[String(status || "").toLowerCase()] || "");

const attendanceSummary = (statuses) => {
  const counts = { P: 0, A: 0, T: 0, J: 0 };
  Object.values(statuses).forEach((status) => {
    const code = attendanceCode(status);
    if (code) counts[code] += 1;
  });
  const total = counts.P + counts.A + counts.T + counts.J;
  return {
    presentes: counts.P,
    ausentes: counts.A,
    tardanzas: counts.T,
    justificados: counts.J,
    porcentaje: total ? counts.P / total : null,
  };
};

const claseContext = (clase = {}) => [
  { etiqueta: "Curso / división", valor: `${clase.anio ?? clase.nivel ?? "—"}° "${clase.division || "—"}"` },
  { etiqueta: "Materia", valor: clase.materia?.nombre || clase.materiaNombre || clase.materia || "—" },
  {
    etiqueta: "Profesor titular",
    valor: clase.profesor?.nombre
      || clase.profesorNombre
      || clase.profesores?.map((profesor) => profesor.nombre).filter(Boolean).join(", ")
      || clase.profesor
      || "No informado",
  },
  { etiqueta: "Turno", valor: clase.turno || "No informado" },
  {
    etiqueta: "Horario",
    valor: clase.horaInicio && clase.horaFin ? `${clase.horaInicio}–${clase.horaFin}` : "No informado",
  },
];

export const crearPlanillaNotasCurso = ({
  alumnos = [],
  notasData = {},
  recuperaciones = {},
  ciclo = {},
  cicloEstado,
  clase = {},
  materiaNombre,
}) => {
  const filas = alumnos.map((alumno, index) => {
    const t1 = gradeFor(notasData, "1", alumno._id);
    const t2 = gradeFor(notasData, "2", alumno._id);
    const t3 = gradeFor(notasData, "3", alumno._id);
    const completo = [t1, t2, t3].every((nota) => nota !== null);
    const puntajeFinal = completo ? t1 + t2 + t3 : null;
    const recovery = recuperaciones[alumno._id]?.notaRecuperacion;
    const notaRecuperacion = asNumberOrNull(recovery);
    const estado = puntajeFinal === null
      ? "INCOMPLETA"
      : puntajeFinal >= 18
        ? "APROBADA"
        : recuperaciones[alumno._id]?.estadoMateria
          || (notaRecuperacion !== null
            ? notaRecuperacion >= 6 ? "APROBADA_RECUPERACION" : "DESAPROBADA"
            : cicloEstado === "CERRADO" ? "DESAPROBADA" : "A_RECUPERACION");

    return {
      numero: index + 1,
      alumno: alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre,
      dni: alumno.dni || "",
      t1,
      t2,
      t3,
      puntajeFinal,
      recuperacion: notaRecuperacion,
      condicion: statusLabel(estado),
    };
  });

  return {
    titulo: "Planilla de notas por curso y materia",
    nombreArchivo: `Notas_${ciclo.anio || "Ciclo"}_${clase.anio || clase.nivel || ""}${clase.division || ""}_${materiaNombre || "Materia"}`,
    cicloLectivo: ciclo.anio,
    formatoEditable: "excel",
    orientacion: "landscape",
    contexto: [
      ...claseContext({ ...clase, materiaNombre: materiaNombre || clase.materiaNombre }),
      { etiqueta: "Período", valor: "Anual · T1, T2 y T3" },
    ],
    columnas: [
      { titulo: "N°", clave: "numero", ancho: 7, alineacion: "center" },
      { titulo: "Apellido y Nombre", clave: "alumno", ancho: 34 },
      { titulo: "DNI", clave: "dni", ancho: 15, alineacion: "center" },
      { titulo: "T1", clave: "t1", ancho: 12, alineacion: "center" },
      { titulo: "T2", clave: "t2", ancho: 12, alineacion: "center" },
      { titulo: "T3", clave: "t3", ancho: 12, alineacion: "center" },
      {
        titulo: "Suma",
        clave: "puntajeFinal",
        ancho: 13,
        alineacion: "center",
        formula: (rowNumber) => `IF(COUNT(D${rowNumber}:F${rowNumber})<3,"",SUM(D${rowNumber}:F${rowNumber}))`,
        formatoCondicional: { valor: 18 },
      },
      { titulo: "Recup.", clave: "recuperacion", ancho: 14, alineacion: "center" },
      { titulo: "Condición", clave: "condicion", ancho: 23 },
    ],
    filas,
    firmas: ["Firma del Directivo", "Firma del Profesor", "Firma del Preceptor"],
  };
};

export const crearPlanillaAsistenciaMensual = ({ reporte, ciclo = {}, mes }) => {
  const clase = reporte?.clase || {};
  const fechas = Array.isArray(reporte?.fechas) ? [...reporte.fechas].sort() : [];
  const fechasDetalle = fechas.length ? fechas : [null];
  const alumnos = Array.isArray(reporte?.alumnos) ? reporte.alumnos : [];
  const firstDetailColumn = 9;
  const lastDetailColumn = firstDetailColumn + fechasDetalle.length - 1;
  const firstDetailLetter = excelColumn(firstDetailColumn);
  const lastDetailLetter = excelColumn(lastDetailColumn);

  const filas = alumnos.map((alumno, index) => {
    const estados = Object.fromEntries(
      Object.entries(alumno.estados || {}).map(([fecha, estado]) => [fecha, attendanceCode(estado)]),
    );
    const summary = attendanceSummary(alumno.estados || {});
    return {
      numero: index + 1,
      alumno: alumno.nombre || "Alumno",
      dni: alumno.dni || "",
      ...summary,
      ...Object.fromEntries(fechasDetalle.map((fecha) => [
        fecha ? `dia_${fecha}` : "sinRegistros",
        fecha ? estados[fecha] || "" : "",
      ])),
    };
  });
  const formulaFor = (code) => (rowNumber) =>
    `COUNTIF(${firstDetailLetter}${rowNumber}:${lastDetailLetter}${rowNumber},"${code}")`;

  return {
    titulo: "Planilla mensual de asistencias",
    nombreArchivo: `Asistencias_${mes}_${clase.anio || ""}${clase.division || ""}_${clase.materia || "Curso"}`,
    cicloLectivo: ciclo.anio,
    formatoEditable: "excel",
    orientacion: "landscape",
    contexto: [
      ...claseContext(clase),
      { etiqueta: "Período", valor: mes },
      { etiqueta: "Fechas con registros", valor: fechas.map(formatearFecha).join(", ") || "Sin registros" },
    ],
    columnas: [
      { titulo: "N°", clave: "numero", ancho: 7, alineacion: "center" },
      { titulo: "Apellido y Nombre", clave: "alumno", ancho: 34 },
      { titulo: "DNI", clave: "dni", ancho: 15, alineacion: "center" },
      { titulo: "P", clave: "presentes", ancho: 9, alineacion: "center", formula: formulaFor("P") },
      { titulo: "A", clave: "ausentes", ancho: 9, alineacion: "center", formula: formulaFor("A") },
      { titulo: "T", clave: "tardanzas", ancho: 9, alineacion: "center", formula: formulaFor("T") },
      { titulo: "J", clave: "justificados", ancho: 9, alineacion: "center", formula: formulaFor("J") },
      {
        titulo: "% Asistencia",
        clave: "porcentaje",
        ancho: 14,
        alineacion: "center",
        numFmt: "0%",
        formula: (rowNumber) => `IF(SUM(D${rowNumber}:G${rowNumber})=0,"",D${rowNumber}/SUM(D${rowNumber}:G${rowNumber}))`,
      },
      ...fechasDetalle.map((fecha) => ({
        titulo: fecha || "Sin registros",
        clave: fecha ? `dia_${fecha}` : "sinRegistros",
        ancho: 5,
        soloExcel: true,
        alineacion: "center",
      })),
    ],
    filas,
    firmas: ["Firma del Directivo", "Firma del Preceptor", "Firma del Profesor"],
  };
};

export const crearNominaClase = ({ clase = {}, alumnos = [], ciclo = {} }) => ({
  titulo: "Nómina oficial de alumnos",
  nombreArchivo: `Nomina_${ciclo.anio || "Ciclo"}_${clase.anio || clase.nivel || ""}${clase.division || ""}_${clase.materia?.nombre || clase.materiaNombre || "Clase"}`,
  cicloLectivo: ciclo.anio,
  formatoEditable: "word",
  formatosEditables: ["word", "excel"],
  orientacion: "portrait",
  contexto: [
    ...claseContext(clase),
    { etiqueta: "Total de alumnos", valor: alumnos.length },
  ],
  columnas: [
    { titulo: "N°", clave: "numero", ancho: 8, alineacion: "center" },
    { titulo: "Apellido y Nombre", clave: "alumno", ancho: 35 },
    { titulo: "DNI", clave: "dni", ancho: 15, alineacion: "center" },
    { titulo: "Email / Contacto", clave: "email", ancho: 28 },
    { titulo: "Estado", clave: "estado", ancho: 22 },
    { titulo: "Observaciones / Firma", clave: "observaciones", ancho: 36 },
  ],
  filas: alumnos.map((alumno, index) => ({
    numero: index + 1,
    alumno: alumno.apellido ? `${alumno.apellido}, ${alumno.nombre}` : alumno.nombre,
    dni: alumno.dni || "",
    email: alumno.email || "",
    estado: !alumno.isActive
      ? "Inscripción suspendida"
      : alumno.alumnoActivo === false ? "Cuenta inactiva" : "Inscripto",
    observaciones: "",
  })),
  firmas: ["Firma del Directivo", "Firma del Preceptor", "Firma del Profesor"],
});
