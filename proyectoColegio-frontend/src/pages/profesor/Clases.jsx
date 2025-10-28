// src/pages/profesor/Clases.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const Clases = () => {
  const { token } = useAuth();
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ diaSemana: "", anio: "" });

  const diasSemana = {
    Domingo: "Domingo",
    Lunes: "Lunes",
    Martes: "Martes",
    Miércoles: "Miércoles",
    Jueves: "Jueves",
    Viernes: "Viernes",
    Sábado: "Sábado",
  };

  // --- helpers para horario que viene como "HH:mm - HH:mm" ---
  const extraerHoras = (horario) => {
    if (typeof horario !== "string") return { ini: "", fin: "" };
    const [ini, fin] = horario.split("-").map((s) => s.trim());
    return { ini: ini || "", fin: fin || "" };
  };

  const getHoraInicio = (clase) =>
    clase?.horaInicio || extraerHoras(clase?.horario).ini;

  const getHoraFin = (clase) =>
    clase?.horaFin || extraerHoras(clase?.horario).fin;

  const formatearHora = (hhmm) => {
    if (!hhmm || typeof hhmm !== "string") return "";
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
    const hour = h % 12 || 12;
    const ampm = h >= 12 ? "PM" : "AM";
    const minute = m < 10 ? `0${m}` : `${m}`;
    return `${hour}:${minute} ${ampm}`;
  };

  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return "N/A";
    const [ih, im] = inicio.split(":").map(Number);
    const [fh, fm] = fin.split(":").map(Number);
    const mins = fh * 60 + fm - (ih * 60 + im);
    if (mins <= 0) return "N/A";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  const esHoy = (dia) => {
    const hoy = new Date().getDay(); // 0=Domingo … 6=Sábado
    const mapa = {
      Domingo: 0,
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
    };
    return mapa[dia] === hoy;
  };

  const obtenerClases = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/clases/misclases", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setClases(Array.isArray(data.clases) ? data.clases : []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las clases.");
      setClases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) obtenerClases();
    else {
      setLoading(false);
      setError("No hay token de autenticación");
    }
  }, [token]);

  // filtros
  const clasesFiltradas = clases.filter((clase) => {
    const cumpleDia = !filtros.diaSemana || clase.diaSemana === filtros.diaSemana;
    const cumpleAnio = !filtros.anio || String(clase.anio) === filtros.anio;
    return cumpleDia && cumpleAnio;
  });

  // agrupado por día
  const clasesAgrupadas = clasesFiltradas.reduce((acc, c) => {
    if (!c?.diaSemana) return acc;
    acc[c.diaSemana] ??= [];
    acc[c.diaSemana].push(c);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(diasSemana).filter(
    (d) => clasesAgrupadas[d]?.length
  );

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Tus Clases
        </h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Tus Clases
        </h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={obtenerClases}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Tus Clases</h2>
        <div className="text-sm text-gray-600">
          Total: {clasesFiltradas.length} clase
          {clasesFiltradas.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día de la semana
            </label>
            <select
              value={filtros.diaSemana}
              onChange={(e) =>
                setFiltros((p) => ({ ...p, diaSemana: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los días</option>
              {Object.keys(diasSemana).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              value={filtros.anio}
              onChange={(e) => setFiltros((p) => ({ ...p, anio: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los años</option>
              {[...new Set(clasesFiltradas.map((c) => c.anio))]
                .filter(Boolean)
                .sort()
                .map((a) => (
                  <option key={a} value={a}>
                    {a}° año
                  </option>
                ))}
            </select>
          </div>
        </div>

        {(filtros.diaSemana || filtros.anio) && (
          <button
            onClick={() => setFiltros({ diaSemana: "", anio: "" })}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {clasesFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No tienes clases asignadas
          </h3>
          <p className="text-gray-600">
            {filtros.diaSemana || filtros.anio
              ? "No hay clases que coincidan con los filtros aplicados."
              : "Contacta al administrador para que te asigne clases."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {diasOrdenados.map((dia) => (
            <div
              key={dia}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div
                className={`px-6 py-4 ${
                  esHoy(dia) ? "bg-blue-50" : "bg-gray-50"
                } border-b border-gray-200`}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <span>{dia}</span>
                  {esHoy(dia) && (
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Hoy
                    </span>
                  )}
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {clasesAgrupadas[dia]
                  .slice()
                  .sort((a, b) =>
                    (getHoraInicio(a) || "").localeCompare(getHoraInicio(b) || "")
                  )
                  .map((clase) => {
                    const hi = getHoraInicio(clase);
                    const hf = getHoraFin(clase);
                    return (
                      <div
                        key={clase.id || clase._id}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        {/* Encabezado */}
                        <div className="mb-4">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">
                            {clase.materia?.nombre || "Materia sin nombre"}
                          </h4>

                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                              {clase.anio ?? "N/A"}° año
                            </span>
                            {clase.anioCursada && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                                {clase.anioCursada}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Horario */}
                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Día
                            </div>
                            <div className="text-base font-semibold text-gray-800">
                              {clase.diaSemana || "Sin día"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Horario
                            </div>
                            <div className="text-base font-semibold text-gray-800">
                              {clase.horario
                                ? clase.horario
                                : `${formatearHora(hi)} - ${formatearHora(hf)}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              Duración:{" "}
                              {clase.duracion || calcularDuracion(hi, hf)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Creación
                            </div>
                            <div className="text-base font-semibold text-gray-800">
                              {clase.fechaCreacion
                                ? new Date(
                                    clase.fechaCreacion
                                  ).toLocaleDateString()
                                : "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clases;