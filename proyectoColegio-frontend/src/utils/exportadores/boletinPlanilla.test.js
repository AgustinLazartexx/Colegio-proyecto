import assert from "node:assert/strict";
import test from "node:test";
import {
  agruparNotasBoletin,
  crearDocumentoBoletin,
  etiquetaCondicionMateria,
  extraerApellidoAlumno,
  resumirBoletin,
} from "./boletinPlanilla.js";

test("agruparNotasBoletin includes subjects without grades and calculates final status", () => {
  const materias = agruparNotasBoletin([
    { materia: { _id: "math", nombre: "Matemática" }, trimestre: 1, notaFinalTrimestre: 5 },
    { materia: { _id: "math", nombre: "Matemática" }, trimestre: 2, notaFinalTrimestre: 6 },
    {
      materia: { _id: "math", nombre: "Matemática" },
      trimestre: 3,
      notaFinalTrimestre: 6,
      notaRecuperacion: 7,
      estadoMateria: "APROBADA_RECUPERACION",
    },
    { materia: { _id: "science", nombre: "Ciencias" }, trimestre: 1, notaFinalTrimestre: 6 },
    { materia: { _id: "science", nombre: "Ciencias" }, trimestre: 2, notaFinalTrimestre: 6 },
    { materia: { _id: "science", nombre: "Ciencias" }, trimestre: 3, notaFinalTrimestre: 6 },
  ], [
    { _id: "math", nombre: "Matemática" },
    { _id: "history", nombre: "Historia" },
    { _id: "science", nombre: "Ciencias" },
  ]);

  assert.deepEqual(materias.map(({ nombre }) => nombre), ["Matemática", "Historia", "Ciencias"]);
  assert.equal(materias[0].puntajeFinal, 5.67);
  assert.equal(materias[0].estadoFinal, "APROBADA_RECUPERACION");
  assert.equal(materias[1].puntajeFinal, null);
  assert.equal(materias[1].estadoFinal, "INCOMPLETA");
  assert.equal(materias[2].puntajeFinal, 6);
  assert.equal(materias[2].estadoFinal, "APROBADA");
  assert.equal(etiquetaCondicionMateria("APROBADA"), "Aprobada");
  assert.equal(etiquetaCondicionMateria("DESAPROBADA"), "Pendiente");
  assert.equal(etiquetaCondicionMateria("INCOMPLETA"), "En curso");
});

test("resumirBoletin applies promotion and repetition rules", () => {
  const aprobadas = [
    { puntajeFinal: 8, estadoFinal: "APROBADA" },
    { puntajeFinal: 7, estadoFinal: "APROBADA" },
  ];
  const resumenOk = resumirBoletin({ materias: aprobadas, nivel: 3, estadoCiclo: "ACTIVO" });
  assert.equal(resumenOk.promedioGeneral, 7.5);
  assert.equal(resumenOk.aprobadas, 2);
  assert.equal(resumenOk.pendientesCiclo, 0);
  assert.equal(resumenOk.condicionCodigo, "PROMOVIDO");

  const cincoDesaprobadas = Array.from({ length: 5 }, () => ({ puntajeFinal: 4.5, estadoFinal: "DESAPROBADA" }));
  const resumenRepite = resumirBoletin({ materias: cincoDesaprobadas, nivel: 3, estadoCiclo: "CERRADO" });
  assert.equal(resumenRepite.condicionCodigo, "REPITENTE");
  assert.equal(resumenRepite.condicionLabel, "Repite");
});

test("crearDocumentoBoletin builds formal Constancia Academica with emission code, summary row, and optional attendance", () => {
  const materias = [
    { id: "m1", nombre: "Matemática", t1: 8, t2: 7, t3: 9, puntajeFinal: 8, notaRecuperacion: null, estadoFinal: "APROBADA" },
    { id: "m2", nombre: "Historia", t1: 5, t2: 5, t3: 5, puntajeFinal: 5, notaRecuperacion: null, estadoFinal: "DESAPROBADA" },
  ];
  const documento = crearDocumentoBoletin({
    alumno: {
      nombre: "Juan Pérez",
      dni: "40.123.456",
      estadoAcademico: "PROMOVIDO_CON_PREVIAS",
    },
    ciclo: { anio: 2026, nombre: "Ciclo Lectivo 2026", estado: "CERRADO" },
    curso: { anio: 3, division: "A" },
    materias,
    previas: [{
      materia: "Ciencias",
      anioOrigen: 2025,
      nivelOrigen: 2,
      estado: "PENDIENTE",
    }],
    asistencia: {
      historial: [{ estado: "presente" }, { estado: "ausente" }, { estado: "tarde" }],
      resumen: { total: 3, presentes: 1, porcentaje: 33 },
    },
  });

  assert.equal(extraerApellidoAlumno({ nombre: "Juan Pérez" }), "Pérez");
  assert.equal(documento.titulo, "CONSTANCIA ACADÉMICA - BOLETÍN DE CALIFICACIONES");
  assert.equal(documento.nombreArchivo, "Constancia_Academica_Pérez_2026");
  assert.equal(documento.codigoEmision, "CONST-2026-40123456");
  assert.equal(documento.orientacion, "portrait");
  assert.equal(documento.contexto.find(({ etiqueta }) => etiqueta === "Código de emisión").valor, "CONST-2026-40123456");
  assert.equal(documento.filas.length, 3);
  assert.equal(documento.filas[2].esResumen, true);
  assert.equal(documento.filas[2].puntajeFinal, "6.50");
  assert.match(documento.secciones[0].contenido, /promedio general de 6\.50/);
  assert.match(documento.secciones[0].contenido, /33% de asistencia/);
  assert.equal(documento.secciones[1].filas.length, 1);
  assert.deepEqual(documento.firmas, ["Dirección", "Secretaría", "Sello Institucional"]);

  // Without attendance data, it must omit attendance without breaking
  const sinAsistencia = crearDocumentoBoletin({
    alumno: { nombre: "Ana Gómez", dni: "41222333" },
    ciclo: { anio: 2026, estado: "ACTIVO" },
    curso: { anio: 1, division: "A" },
    materias,
    asistencia: null,
  });
  assert.doesNotMatch(sinAsistencia.secciones[0].contenido, /asistencia/);
});
