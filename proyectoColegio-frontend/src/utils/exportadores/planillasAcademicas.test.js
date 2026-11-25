import assert from "node:assert/strict";
import test from "node:test";
import {
  crearNominaClase,
  crearPlanillaAsistenciaMensual,
  crearPlanillaNotasCurso,
} from "./planillasAcademicas.js";

test("la planilla de notas genera una suma anual solo con los tres trimestres", () => {
  const documento = crearPlanillaNotasCurso({
    alumnos: [{ _id: "alumno-1", nombre: "Ana", apellido: "Pérez" }],
    notasData: {
      "1": { "alumno-1": { notaFinalTrimestre: 8 } },
      "2": { "alumno-1": { notaFinalTrimestre: 7 } },
      "3": { "alumno-1": { notaFinalTrimestre: 9 } },
    },
    ciclo: { anio: 2026 },
    clase: { anio: 2, division: "A" },
    materiaNombre: "Matemática",
  });

  assert.equal(documento.filas[0].puntajeFinal, 24);
  assert.equal(documento.columnas.find(({ clave }) => clave === "puntajeFinal").formula(8), 'IF(COUNT(D8:F8)<3,"",SUM(D8:F8))');
  assert.equal(documento.orientacion, "landscape");
});

test("la planilla mensual cuenta P/A/T/J desde las columnas diarias ocultas", () => {
  const documento = crearPlanillaAsistenciaMensual({
    ciclo: { anio: 2026 },
    mes: "2026-03",
    reporte: {
      clase: { anio: 2, division: "A", materia: "Matemática", profesor: "Docente", horaInicio: "08:00", horaFin: "09:00" },
      fechas: ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"],
      alumnos: [{
        nombre: "Ana Pérez",
        dni: "123",
        estados: {
          "2026-03-02": "presente",
          "2026-03-03": "ausente",
          "2026-03-04": "tarde",
          "2026-03-05": "justificado",
        },
      }],
    },
  });

  assert.equal(documento.filas[0].presentes, 1);
  assert.equal(documento.filas[0].ausentes, 1);
  assert.equal(documento.filas[0].tardanzas, 1);
  assert.equal(documento.filas[0].justificados, 1);
  assert.deepEqual(
    documento.columnas.slice(3, 7).map(({ formula }) => formula(8)),
    ['COUNTIF(I8:L8,"P")', 'COUNTIF(I8:L8,"A")', 'COUNTIF(I8:L8,"T")', 'COUNTIF(I8:L8,"J")'],
  );
  assert.equal(documento.columnas.find(({ clave }) => clave === "porcentaje").formula(8), 'IF(SUM(D8:G8)=0,"",D8/SUM(D8:G8))');
  assert.deepEqual(documento.columnas.slice(-4).map(({ soloExcel }) => soloExcel), [true, true, true, true]);
});

test("la nómina conserva estados de inscripción y ofrece Word y Excel", () => {
  const documento = crearNominaClase({
    ciclo: { anio: 2026 },
    clase: { anio: 2, division: "A", materiaNombre: "Matemática" },
    alumnos: [
      { nombre: "Ana", apellido: "Pérez", isActive: true },
      { nombre: "Luis", apellido: "Gómez", isActive: false },
    ],
  });

  assert.deepEqual(documento.formatosEditables, ["word", "excel"]);
  assert.deepEqual(documento.filas.map(({ estado }) => estado), ["Inscripto", "Inscripción suspendida"]);
});
