const asNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeAcademicStatus = (status) => {
  const normalized = String(status || "").toUpperCase();
  const labels = {
    CURSANDO: "En curso",
    PROMOVIDO: "Promovido",
    PROMOVIDO_CON_PREVIAS: "Promovido con previas",
    REPITENTE: "Repite",
    EGRESADO: "Egresado",
    EGRESADO_CON_PREVIAS: "Egresado con previas",
    BAJA: "Baja",
  };
  return labels[normalized] || normalized || "En curso";
};

export const etiquetaCondicionMateria = (estadoFinal) => {
  const normalized = String(estadoFinal || "").toUpperCase();
  if (normalized === "APROBADA") return "Aprobada";
  if (normalized === "APROBADA_RECUPERACION") return "Aprobada (Recup.)";
  if (normalized === "DESAPROBADA" || normalized === "A_RECUPERACION") return "Pendiente";
  return "En curso";
};

export const extraerApellidoAlumno = (alumno = {}) => {
  if (typeof alumno.apellido === "string" && alumno.apellido.trim()) {
    return alumno.apellido.trim();
  }
  const fullName = String(alumno.nombre || "").trim();
  if (!fullName) return "Alumno";
  if (fullName.includes(",")) {
    return fullName.split(",")[0].trim() || "Alumno";
  }
  const parts = fullName.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
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
      ? Number(((materia.t1 + materia.t2 + materia.t3) / 3).toFixed(2))
      : null;
    const estadoFinal = puntajeFinal === null
      ? "INCOMPLETA"
      : puntajeFinal >= 6
        ? "APROBADA"
        : materia.estadoMateria || (estadoCiclo === "RECUPERACION" ? "A_RECUPERACION" : "DESAPROBADA");

    return { ...materia, puntajeFinal, estadoFinal };
  });
};

export const resumirBoletin = ({
  materias = [],
  previas = [],
  nivel,
  estadoCiclo,
  estadoAcademico,
} = {}) => {
  const promedios = materias
    .map((materia) => asNumberOrNull(materia.puntajeFinal))
    .filter((valor) => valor !== null);

  const promedioGeneral = promedios.length
    ? Number((promedios.reduce((acc, valor) => acc + valor, 0) / promedios.length).toFixed(2))
    : null;

  const aprobadas = materias.filter((materia) =>
    ["APROBADA", "APROBADA_RECUPERACION"].includes(materia.estadoFinal),
  ).length;
  const pendientesCiclo = materias.filter((materia) =>
    ["DESAPROBADA", "A_RECUPERACION"].includes(materia.estadoFinal),
  ).length;
  const enCurso = materias.filter((materia) => materia.estadoFinal === "INCOMPLETA").length;
  const previasPendientes = previas.filter((previa) => previa.estado === "PENDIENTE").length;

  let condicionCodigo = String(estadoAcademico || "").toUpperCase();
  if (!condicionCodigo || condicionCodigo === "CURSANDO") {
    if (materias.length === 0 || (enCurso > 0 && estadoCiclo !== "CERRADO")) {
      condicionCodigo = "CURSANDO";
    } else {
      const egresa = Number(nivel) === 6;
      if (pendientesCiclo >= 5) condicionCodigo = "REPITENTE";
      else if (pendientesCiclo > 0) condicionCodigo = egresa ? "EGRESADO_CON_PREVIAS" : "PROMOVIDO_CON_PREVIAS";
      else condicionCodigo = egresa ? "EGRESADO" : "PROMOVIDO";
    }
  }

  return {
    promedioGeneral,
    totalMaterias: materias.length,
    aprobadas,
    pendientesCiclo,
    enCurso,
    previasPendientes,
    condicionCodigo,
    condicionLabel: normalizeAcademicStatus(condicionCodigo),
  };
};

const obtenerResumenAsistencia = (asistencia) => {
  if (!asistencia) return null;
  const hasResumen = asistencia.resumen && typeof asistencia.resumen === "object";
  const historial = Array.isArray(asistencia.historial)
    ? asistencia.historial
    : Array.isArray(asistencia) ? asistencia : null;
  if (!hasResumen && !historial) return null;

  const lista = historial || [];
  const contar = (estado) => lista.filter(
    (registro) => String(registro.estado || "").toLowerCase() === estado,
  ).length;
  const total = Number(asistencia.resumen?.total ?? lista.length);
  const presentes = Number(asistencia.resumen?.presentes ?? contar("presente"));
  const porcentajeRaw = asistencia.resumen?.porcentaje;
  const porcentaje = Number.isFinite(Number(porcentajeRaw))
    ? Number(porcentajeRaw)
    : total > 0 ? Math.round((presentes / total) * 100) : null;

  if (porcentaje === null && total === 0) return null;
  return {
    total,
    presentes,
    ausentes: contar("ausente"),
    tardanzas: contar("tarde"),
    porcentaje,
  };
};

const formatGradeValue = (value) => {
  const num = asNumberOrNull(value);
  return num === null ? "—" : num.toFixed(2);
};

export const crearDocumentoBoletin = ({
  alumno = {},
  ciclo = {},
  curso = {},
  materias = [],
  previas = [],
  asistencia = null,
}) => {
  const previasPendientes = previas.filter((previa) => previa.estado === "PENDIENTE");
  const attendance = obtenerResumenAsistencia(asistencia);
  const nivel = curso.anio ?? curso.nivel ?? alumno.nivel ?? alumno.anioCiclo ?? alumno.anio;
  const division = curso.division ?? alumno.divisionCiclo ?? alumno.division;
  const cursoLabel = nivel ? `${nivel}° Año${division ? ` "${division}"` : ""}` : "No informado";
  const cicloAnio = ciclo.anio ?? new Date().getFullYear();
  const cicloNombre = ciclo.nombre || (ciclo.anio ? `Ciclo Lectivo ${ciclo.anio}` : "—");
  const nombreAlumno = alumno.apellido && alumno.nombre && !String(alumno.nombre).includes(alumno.apellido)
    ? `${alumno.apellido}, ${alumno.nombre}`
    : alumno.nombre || "No informado";
  const apellidoArchivo = extraerApellidoAlumno(alumno);
  const dniLimpio = String(alumno.dni || "").replace(/\D/g, "");
  const codigoEmision = `CONST-${cicloAnio}-${dniLimpio || "SINDNI"}`;
  const nombreArchivo = `Constancia_Academica_${apellidoArchivo}_${cicloAnio}`;

  const resumen = resumirBoletin({
    materias,
    previas,
    nivel,
    estadoCiclo: ciclo.estado,
    estadoAcademico: alumno.estadoAcademico || curso.estadoAcademico,
  });

  const filasMaterias = materias.map((materia) => ({
    id: materia.id,
    nombre: materia.nombre,
    t1: formatGradeValue(materia.t1),
    t2: formatGradeValue(materia.t2),
    t3: formatGradeValue(materia.t3),
    puntajeFinal: formatGradeValue(materia.puntajeFinal),
    notaRecuperacion: formatGradeValue(materia.notaRecuperacion),
    estadoFinal: etiquetaCondicionMateria(materia.estadoFinal),
  }));

  if (materias.length > 0) {
    filasMaterias.push({
      id: "__resumen_promedio__",
      esResumen: true,
      nombre: "PROMEDIO GENERAL",
      t1: "",
      t2: "",
      t3: "",
      puntajeFinal: resumen.promedioGeneral === null ? "—" : resumen.promedioGeneral.toFixed(2),
      notaRecuperacion: "",
      estadoFinal: resumen.condicionLabel,
    });
  }

  const promedioTexto = resumen.promedioGeneral === null
    ? "sin promedio general definitivo por encontrarse calificaciones en curso"
    : `un promedio general de ${resumen.promedioGeneral.toFixed(2)} puntos`;
  const asistenciaTexto = attendance && attendance.porcentaje !== null
    ? ` Asimismo, registra un ${attendance.porcentaje}% de asistencia (${attendance.presentes} presentes sobre ${attendance.total} registros).`
    : "";
  const previasTexto = previasPendientes.length > 0
    ? ` Registra ${previasPendientes.length} materia${previasPendientes.length === 1 ? "" : "s"} previa${previasPendientes.length === 1 ? "" : "s"} pendiente${previasPendientes.length === 1 ? "" : "s"} de ciclos anteriores.`
    : "";

  const parrafoSituacion =
    `Se deja constancia de que ${nombreAlumno} (DNI ${alumno.dni || "No informado"}), estudiante de ${cursoLabel} correspondiente al ${cicloNombre}, registra ${promedioTexto}, con ${resumen.aprobadas} materia${resumen.aprobadas === 1 ? "" : "s"} aprobada${resumen.aprobadas === 1 ? "" : "s"} y ${resumen.pendientesCiclo} pendiente${resumen.pendientesCiclo === 1 ? "" : "s"} en el ciclo actual, resultando en condición académica: ${resumen.condicionLabel}.${asistenciaTexto}${previasTexto}`;

  const contexto = [
    { etiqueta: "Alumno", valor: nombreAlumno },
    { etiqueta: "DNI", valor: alumno.dni || "No informado" },
    { etiqueta: "Año / Curso", valor: cursoLabel },
    { etiqueta: "Ciclo lectivo", valor: cicloNombre },
    { etiqueta: "Condición académica", valor: resumen.condicionLabel },
    { etiqueta: "Código de emisión", valor: codigoEmision },
  ];

  const secciones = [
    {
      titulo: "Situación académica",
      contenido: parrafoSituacion,
      tipo: "parrafo",
    },
  ];

  if (previasPendientes.length > 0) {
    secciones.push({
      titulo: "Materias previas pendientes",
      columnas: [
        { titulo: "Materia", clave: "materia" },
        { titulo: "Ciclo de origen", clave: "anioOrigen", alineacion: "center" },
        { titulo: "Nivel de origen", clave: "nivelOrigen", alineacion: "center" },
        { titulo: "Estado", clave: "estado", alineacion: "center" },
      ],
      filas: previasPendientes,
      contenido: "",
    });
  }

  return {
    titulo: "CONSTANCIA ACADÉMICA - BOLETÍN DE CALIFICACIONES",
    subtitulo: "Nivel Secundario · Registro Oficial de Calificaciones",
    nombreArchivo,
    cicloLectivo: cicloAnio,
    codigoEmision,
    formatoEditable: "word",
    orientacion: "portrait",
    estiloEncabezadoTabla: "oscuro",
    resumen,
    contexto,
    columnas: [
      { titulo: "Materia", clave: "nombre", ancho: 58 },
      { titulo: "1° Trim.", clave: "t1", alineacion: "center", ancho: 17 },
      { titulo: "2° Trim.", clave: "t2", alineacion: "center", ancho: 17 },
      { titulo: "3° Trim.", clave: "t3", alineacion: "center", ancho: 17 },
      { titulo: "Promedio", clave: "puntajeFinal", alineacion: "center", ancho: 22 },
      { titulo: "Recup.", clave: "notaRecuperacion", alineacion: "center", ancho: 18 },
      { titulo: "Condición", clave: "estadoFinal", alineacion: "center", ancho: 33 },
    ],
    filas: filasMaterias,
    secciones,
    firmas: ["Dirección", "Secretaría", "Sello Institucional"],
    pie: `Constancia emitida por el Sistema de Gestión Escolar · Código ${codigoEmision} · Válida con firma y sello institucional`,
  };
};
