import assert from "node:assert/strict";
import test from "node:test";
import { agruparNotasBoletin, crearDocumentoBoletin } from "./boletinPlanilla.js";

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
  assert.equal(materias[0].puntajeFinal, 17);
  assert.equal(materias[0].estadoFinal, "APROBADA_RECUPERACION");
  assert.equal(materias[1].puntajeFinal, null);
  assert.equal(materias[1].estadoFinal, "INCOMPLETA");
  assert.equal(materias[2].puntajeFinal, 18);
  assert.equal(materias[2].estadoFinal, "APROBADA");
});

test("crearDocumentoBoletin includes student context, pending subjects, and attendance summary", () => {
  const documento = crearDocumentoBoletin({
    alumno: {
      nombre: "Juan Pérez",
      dni: "12345678",
      estadoAcademico: "PROMOVIDO_CON_PREVIAS",
    },
    ciclo: { anio: 2026, estado: "CERRADO" },
    curso: { anio: 3, division: "A" },
    materias: [],
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

  assert.equal(documento.formatoEditable, "word");
  assert.equal(documento.orientacion, "portrait");
  assert.equal(documento.contexto.find(({ etiqueta }) => etiqueta === "DNI").valor, "12345678");
  assert.equal(documento.contexto.find(({ etiqueta }) => etiqueta === "Condición académica").valor, "PROMOVIDO CON PREVIAS");
  assert.equal(documento.contexto.find(({ etiqueta }) => etiqueta === "Asistencia").valor, "33% (1/3)");
  assert.equal(documento.secciones[0].filas.length, 1);
  assert.equal(documento.secciones[1].tipo, "observaciones");
  assert.equal(documento.firmas.length, 3);
});
