const asNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeAcademicStatus = (status) => {
  const normalized = String(status || "").toUpperCase();
  const labels = {
    PROMOVIDO_CON_PREVIAS: "PROMOVIDO CON PREVIAS",
  };
  return labels[normalized] || normalized || "NO INFORMADA";
};

export const agruparNotasBoletin = (notas = [], materiasBase = [], estadoCiclo) => {
  const materias = new Map();
  const obtenerId = (materia) => materia?._id || materia?.id || materia?.materiaId || materia?.nombre;

  materiasBase.forEach((materia) => {
    const id = obtenerId(materia) || materia.nombre;
    if (!id) return;
    materias.set(id, {
      id,
      nombre: materia.nombre || materia.materia?.nombre || "Materia",
      t1: null,
      t2: null,
      t3: null,
      notaRecuperacion: null,
      estadoMateria: null,
    });
  });

  notas.forEach((nota) => {
    const materia = nota.materia || {};
    const id = materia._id || nota.materiaId || materia.id || materia.nombre || "materia";
    if (!materias.has(id)) {
      materias.set(id, {
        id,
        nombre: materia.nombre || nota.materiaNombre || "Materia",
        t1: null,
        t2: null,
        t3: null,
        notaRecuperacion: null,
        estadoMateria: null,
      });
    }

    const item = materias.get(id);
    item.notaRecuperacion = asNumberOrNull(nota.notaRecuperacion);
    item.estadoMateria = nota.estadoMateria || item.estadoMateria;
    const trimestre = Number(nota.trimestre);
    if (trimestre >= 1 && trimestre <= 3) {
      item[`t${trimestre}`] = asNumberOrNull(nota.notaFinalTrimestre);
    }
  });

  return [...materias.values()].map((materia) => {
    const trimestreCompleto = [materia.t1, materia.t2, materia.t3].every((nota) => nota !== null);
    const puntajeFinal = trimestreCompleto
      ? materia.t1 + materia.t2 + materia.t3
      : null;
    const estadoFinal = puntajeFinal === null
      ? "INCOMPLETA"
      : puntajeFinal >= 18
        ? "APROBADA"
        : materia.estadoMateria || (estadoCiclo === "CERRADO" ? "DESAPROBADA" : "A_RECUPERACION");

    return { ...materia, puntajeFinal, estadoFinal };
  });
};

const obtenerResumenAsistencia = (asistencia) => {
  const historial = Array.isArray(asistencia?.historial)
    ? asistencia.historial
    : Array.isArray(asistencia) ? asistencia : [];
  const contar = (estado) => historial.filter(
    (registro) => String(registro.estado || "").toLowerCase() === estado,
  ).length;
  const total = Number(asistencia?.resumen?.total ?? historial.length);
  const presentes = Number(asistencia?.resumen?.presentes ?? contar("presente"));
  const ausentes = contar("ausente");
  const tardanzas = contar("tarde");
  const porcentaje = asistencia?.resumen?.porcentaje
    ?? (total ? Math.round((presentes / total) * 100) : 100);
  return { total, presentes, ausentes, tardanzas, porcentaje };
};

export const crearDocumentoBoletin = ({
  alumno = {},
  ciclo = {},
  curso = {},
  materias = [],
  previas = [],
  asistencia,
}) => {
  const previasPendientes = previas.filter((previa) => previa.estado === "PENDIENTE");
  const attendance = obtenerResumenAsistencia(asistencia);
  const nivel = curso.anio ?? curso.nivel ?? alumno.nivel ?? alumno.anioCiclo ?? alumno.anio;
  const division = curso.division ?? alumno.divisionCiclo ?? alumno.division;
  const cursoLabel = nivel ? `${nivel}° Año${division ? ` "${division}"` : ""}` : "No informado";
  const cicloLectivo = ciclo.anio ?? ciclo.nombre ?? "—";
  const nombreAlumno = alumno.nombre || [alumno.apellido, alumno.nombre].filter(Boolean).join(", ");
  const nombreArchivo = `Boletin_${cicloLectivo}_${nombreAlumno || "Alumno"}`;

  return {
    titulo: "Boletín de calificaciones",
    nombreArchivo,
    cicloLectivo,
    formatoEditable: "word",
    orientacion: "portrait",
    contexto: [
      { etiqueta: "Apellido y nombre", valor: nombreAlumno || "No informado" },
      { etiqueta: "DNI", valor: alumno.dni || "No informado" },
      { etiqueta: "Curso / división", valor: cursoLabel },
      { etiqueta: "Condición académica", valor: normalizeAcademicStatus(
        alumno.estadoAcademico || curso.estadoAcademico || (ciclo.estado === "CERRADO" ? "" : "CURSANDO"),
      ) },
      { etiqueta: "Asistencia", valor: `${attendance.porcentaje}% (${attendance.presentes}/${attendance.total})` },
      { etiqueta: "Presentes / Ausentes / Tardes", valor: `${attendance.presentes} / ${attendance.ausentes} / ${attendance.tardanzas}` },
    ],
    columnas: [
      { titulo: "Materia", clave: "nombre", ancho: 56 },
      { titulo: "1° Trim.", clave: "t1", alineacion: "center", ancho: 17 },
      { titulo: "2° Trim.", clave: "t2", alineacion: "center", ancho: 17 },
      { titulo: "3° Trim.", clave: "t3", alineacion: "center", ancho: 17 },
      { titulo: "Puntaje final", clave: "puntajeFinal", alineacion: "center", ancho: 25 },
      { titulo: "Recuperación", clave: "notaRecuperacion", alineacion: "center", ancho: 23 },
      { titulo: "Estado final", clave: "estadoFinal", alineacion: "center", ancho: 27 },
    ],
    filas: materias.map((materia) => ({
      ...materia,
      puntajeFinal: materia.puntajeFinal === null ? null : materia.puntajeFinal.toFixed(2),
    })),
    secciones: [
      {
        titulo: "Materias previas pendientes",
        columnas: [
          { titulo: "Materia", clave: "materia" },
          { titulo: "Ciclo de origen", clave: "anioOrigen", alineacion: "center" },
          { titulo: "Nivel de origen", clave: "nivelOrigen", alineacion: "center" },
          { titulo: "Estado", clave: "estado", alineacion: "center" },
        ],
        filas: previasPendientes,
        contenido: previasPendientes.length ? "" : "No registra materias previas pendientes.",
      },
      {
        titulo: "Observaciones",
        contenido: "",
        tipo: "observaciones",
      },
    ],
    firmas: ["Firma del Directivo", "Firma del Profesor", "Firma del Padre / Tutor"],
  };
};
