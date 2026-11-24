export const calculateSubjectResult = ({ trimestre1, trimestre2, trimestre3, notaRecuperacion }) => {
  const grades = [trimestre1, trimestre2, trimestre3];
  if (grades.some((grade) => grade === null || grade === undefined)) {
    return { puntajeFinal: null, estadoMateria: "INCOMPLETA", incompleta: true };
  }

  const puntajeFinal = grades.reduce((sum, grade) => sum + Number(grade), 0);
  if (puntajeFinal >= 18) return { puntajeFinal, estadoMateria: "APROBADA", incompleta: false };
  if (notaRecuperacion !== null && notaRecuperacion !== undefined && Number(notaRecuperacion) >= 6) {
    return { puntajeFinal, estadoMateria: "APROBADA_RECUPERACION", incompleta: false };
  }
  return { puntajeFinal, estadoMateria: "DESAPROBADA", incompleta: false };
};

export const suggestedAcademicStatus = (level, failedSubjects) => {
  const graduating = Number(level) === 6;
  if (failedSubjects >= 5) return "REPITENTE";
  if (failedSubjects > 0) return graduating ? "EGRESADO_CON_PREVIAS" : "PROMOVIDO_CON_PREVIAS";
  return graduating ? "EGRESADO" : "PROMOVIDO";
};

export const academicCycleDates = (year) => ({
  fechaInicio: `${year}-03-02`,
  fechaCierre: `${year + 1}-03-02`,
});
