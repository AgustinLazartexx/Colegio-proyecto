export const coloresPlanilla = Object.freeze({
  primario: "193CB8",
  acento: "9D0D06",
  navy: "10233F",
  canvas: "F7F8FC",
  borde: "D7DFEA",
  texto: "344054",
});

export const normalizarDocumento = (documento) => {
  if (!documento || typeof documento !== "object") {
    throw new TypeError("Se requiere la configuración de la planilla.");
  }

  const normalizarFormato = (formato) => {
    const normalized = String(formato || "").toLowerCase();
    if (normalized === "word" || normalized === "docx") return "word";
    if (normalized === "excel" || normalized === "xlsx") return "excel";
    return null;
  };
  const formato = normalizarFormato(documento.formatoEditable) || "excel";
  const formatosEditables = Array.isArray(documento.formatosEditables)
    ? [...new Set(documento.formatosEditables.map(normalizarFormato).filter(Boolean))]
    : [];
  if (formatosEditables.length === 0) formatosEditables.push(formato);
  const normalizarColumnas = (columnas) => Array.isArray(columnas)
    ? columnas.map((columna, index) => {
      if (typeof columna === "string") return { titulo: columna, clave: null };
      return {
        ...columna,
        clave: columna.clave ?? columna.key ?? null,
        titulo: columna.titulo || columna.header || `Columna ${index + 1}`,
      };
    })
    : [];
  const columnas = normalizarColumnas(documento.columnas);
  const contexto = Array.isArray(documento.contexto)
    ? documento.contexto.map((item) => ({
      etiqueta: item.etiqueta ?? item.label ?? "Dato",
      valor: item.valor ?? item.value ?? "",
    }))
    : Object.entries(documento.contexto || {}).map(([etiqueta, valor]) => ({ etiqueta, valor }));
  const secciones = Array.isArray(documento.secciones)
    ? documento.secciones.map((seccion) => ({
      ...seccion,
      titulo: seccion.titulo || "Información adicional",
      columnas: normalizarColumnas(seccion.columnas),
      filas: Array.isArray(seccion.filas) ? seccion.filas : [],
      contenido: seccion.contenido ?? "",
    }))
    : [];

  return {
    ...documento,
    titulo: documento.titulo || "Planilla escolar",
    subtitulo: documento.subtitulo || "Nivel Secundario · Gestión Académica",
    cicloLectivo: documento.cicloLectivo ?? "—",
    fechaEmision: formatearFecha(documento.fechaEmision || new Date()),
    orientacion: documento.orientacion === "landscape" ? "landscape" : "portrait",
    nombreArchivo: nombreArchivoSeguro(documento.nombreArchivo || documento.titulo || "Planilla"),
    formatoEditable: formato,
    formatosEditables,
    contexto,
    columnas,
    filas: Array.isArray(documento.filas) ? documento.filas : [],
    secciones,
    firmas: Array.isArray(documento.firmas) ? documento.firmas : [],
    pie: documento.pie || "Documento generado por el Sistema de Gestión Escolar · Válido con firma y sello institucional",
  };
};

export const obtenerValorCelda = (fila, columna, indice) => {
  if (Array.isArray(fila)) return fila[indice];
  if (columna.clave) return fila?.[columna.clave];
  return Object.values(fila || {})[indice];
};

export const textoCelda = (valor) => {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (valor instanceof Date && !Number.isNaN(valor.valueOf())) return formatearFecha(valor);
  return String(valor);
};

export const formatearFecha = (valor) => {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.valueOf())) return "—";
    return new Intl.DateTimeFormat("es-AR").format(valor);
  }
  if (typeof valor === "string") {
    const isoDate = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
    return valor;
  }
  return "—";
};

export const nombreArchivoSeguro = (nombre) =>
  String(nombre)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Planilla";
