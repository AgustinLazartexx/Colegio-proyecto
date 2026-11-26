import test from "node:test";
import assert from "node:assert/strict";
import {
  academicCycleDates,
  calculateSubjectResult,
  suggestedAcademicStatus,
} from "./academicCycleRules.js";

test("averages the three trimester grades and applies the 6-point passing threshold", () => {
  assert.deepEqual(
    calculateSubjectResult({ trimestre1: 6, trimestre2: 6, trimestre3: 6, notaRecuperacion: null }),
    { puntajeFinal: 6, estadoMateria: "APROBADA", incompleta: false },
  );
  const failed = calculateSubjectResult({ trimestre1: 5, trimestre2: 6, trimestre3: 6, notaRecuperacion: null });
  assert.equal(failed.puntajeFinal, 5.67);
  assert.equal(failed.estadoMateria, "DESAPROBADA");
});

test("annual recovery passes only at six and incomplete trimester grades are not silently approved", () => {
  assert.equal(
    calculateSubjectResult({ trimestre1: 5, trimestre2: 6, trimestre3: 6, notaRecuperacion: 6 }).estadoMateria,
    "APROBADA_RECUPERACION",
  );
  assert.equal(
    calculateSubjectResult({ trimestre1: 5, trimestre2: 6, trimestre3: 6, notaRecuperacion: 5 }).estadoMateria,
    "DESAPROBADA",
  );
  assert.equal(
    calculateSubjectResult({ trimestre1: 9, trimestre2: null, trimestre3: 9 }).estadoMateria,
    "INCOMPLETA",
  );
});

test("suggests promotion, promotion with prior subjects, and repetition at the required boundaries", () => {
  assert.equal(suggestedAcademicStatus(1, 0), "PROMOVIDO");
  assert.equal(suggestedAcademicStatus(5, 4), "PROMOVIDO_CON_PREVIAS");
  assert.equal(suggestedAcademicStatus(6, 4), "EGRESADO_CON_PREVIAS");
  assert.equal(suggestedAcademicStatus(6, 5), "REPITENTE");
  assert.equal(suggestedAcademicStatus(6, 0), "EGRESADO");
});

test("cycle runs from March 2 through March 2 of the following year", () => {
  assert.deepEqual(academicCycleDates(2026), {
    fechaInicio: "2026-03-02",
    fechaCierre: "2027-03-02",
  });
});
