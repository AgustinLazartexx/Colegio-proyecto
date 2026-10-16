import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  CalendarDays,
  Filter,
  UserCheck,
  Search,
  Loader2,
  ShieldCheck,
  User,
  Clock,
  ClipboardCheck,
  AlertTriangle
} from "lucide-react";

// 1. IMPORTAR LAS FUNCIONES DE TU API
import {
  compararAsistencias,
  getTodasLasClases,
  getReporteAsistencias,
} from "../../api/api";

const VerAsistenciasAdmin = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [clases, setClases] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState("materias");
  const [comparacion, setComparacion] = useState(null);
  const [curso, setCurso] = useState({ anio: "", division: "" });

  const [filtros, setFiltros] = useState({
    fecha: new Date().toISOString().split('T')[0], 
    claseId: "",
  });

  // Cargar clases
  useEffect(() => {
    const fetchClases = async () => {
      try {
        // USAR LA FUNCIÓN DE API.JS
        const res = await getTodasLasClases(); 
        setClases(res.data.clases || res.data || []); 
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar la lista de clases");
      }
    };
    fetchClases();
  }, []);

  // Buscar reporte
  const fetchReporte = async () => {
    if (!filtros.claseId || !filtros.fecha) {
        toast.warn("Por favor selecciona una Clase y una Fecha");
        return;
    }

    setLoading(true);
    try {
      // USAR LA NUEVA FUNCIÓN DE API.JS
      const res = await getReporteAsistencias(filtros.claseId, filtros.fecha);
      
      setAsistencias(res.data || []);
      
      if(res.data.length === 0) toast.info("No hay asistencias registradas para esa fecha.");

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const fetchComparacion = async () => {
    if (!curso.anio || !curso.division || !filtros.fecha) {
      toast.warn("Selecciona año, división y fecha");
      return;
    }
    setLoading(true);
    setComparacion(null);
    try {
      const { data } = await compararAsistencias(curso.anio, curso.division, filtros.fecha);
      setComparacion(data);
      if (data.alumnos.length === 0) toast.info("No hay alumnos registrados en ese curso.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Error al comparar las asistencias");
    } finally {
      setLoading(false);
    }
  };
  // Helpers visuales
  const getEstadoBadge = (estado) => {
    const estilos = {
        presente: "bg-green-100 text-green-800",
        ausente: "bg-red-100 text-red-800",
        tarde: "bg-yellow-100 text-yellow-800",
        justificado: "bg-blue-100 text-blue-800"
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${estilos[estado] || "bg-gray-100"}`}>
            {estado}
        </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-600 rounded-full shadow-lg">
            <UserCheck className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporte de Asistencias</h1>
            <p className="text-gray-500">Consulta los registros docentes o compara el control general con las materias.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModo("materias")}
            className={`rounded-lg px-4 py-2 font-semibold ${modo === "materias" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
          >
            Reporte por materia
          </button>
          <button
            onClick={() => setModo("comparacion")}
            className={`rounded-lg px-4 py-2 font-semibold flex items-center gap-2 ${modo === "comparacion" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
          >
            <ClipboardCheck size={18} />
            Control general vs. materias
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
            <Filter size={20} />
            <h2>{modo === "materias" ? "Seleccionar Clase y Fecha" : "Seleccionar Curso y Fecha"}</h2>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${modo === "materias" ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
            {modo === "materias" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clase / Materia</label>
                <select
                  value={filtros.claseId}
                  onChange={(e) => setFiltros({ ...filtros, claseId: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Selecciona una clase --</option>
                  {clases.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.materia?.nombre || "Materia"} - {c.anio}° {c.division} ({c.diaSemana})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <select
                    value={curso.anio}
                    onChange={(e) => {
                      setCurso({ ...curso, anio: e.target.value });
                      setComparacion(null);
                    }}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Selecciona el año --</option>
                    {["1", "2", "3", "4", "5", "6"].map((anio) => <option key={anio} value={anio}>{anio}° Año</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">División</label>
                  <select
                    value={curso.division}
                    onChange={(e) => {
                      setCurso({ ...curso, division: e.target.value });
                      setComparacion(null);
                    }}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Selecciona --</option>
                    {["A", "B", "C"].map((division) => <option key={division} value={division}>{division}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Selector de Fecha */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                    type="date"
                    value={filtros.fecha}
                    onChange={(e) => {
                      setFiltros({ ...filtros, fecha: e.target.value });
                      setComparacion(null);
                    }}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Botón Buscar */}
            <div className="flex items-end">
                <button
                    onClick={modo === "materias" ? fetchReporte : fetchComparacion}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 h-[42px]"
                >
                    {loading ? <Loader2 className="animate-spin" /> : modo === "materias" ? <Search size={20} /> : <ClipboardCheck size={20} />}
                    {modo === "materias" ? "Ver Reporte" : "Comparar asistencias"}
                </button>
            </div>
          </div>
        </div>

        {modo === "comparacion" ? (
          <section className="space-y-5">
            {comparacion && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    ["Alumnos", comparacion.resumen.alumnos],
                    ["Sin control general", comparacion.resumen.generalSinRegistrar],
                    ["Materias del día", comparacion.resumen.clases],
                    ["Materias incompletas", comparacion.resumen.clasesSinAsistencia],
                    ["Diferencias", comparacion.resumen.discrepancias],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-bold text-gray-900 mb-3">
                    Clases programadas — {comparacion.diaSemana}, {comparacion.fecha}
                  </h2>
                  {comparacion.clases.length ? (
                    <div className="flex flex-wrap gap-2">
                      {comparacion.clases.map((clase) => (
                        <span key={clase._id} className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
                          {clase.horaInicio} {clase.materia}: {clase.asistenciasRegistradas}/{clase.alumnosInscritos} registradas
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-500">No hay clases programadas para este curso ese día.</p>}
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  {comparacion.alumnos.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                          <tr>
                            <th className="p-4 border-b">Alumno</th>
                            <th className="p-4 border-b">Control general</th>
                            <th className="p-4 border-b">Asistencia por materia</th>
                            <th className="p-4 border-b">Diferencias</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {comparacion.alumnos.map((alumno) => (
                            <tr key={alumno._id} className="align-top hover:bg-blue-50">
                              <td className="p-4 font-semibold text-gray-900">{alumno.nombre}</td>
                              <td className="p-4">{getEstadoBadge(alumno.estadoGeneral || "sin registro")}</td>
                              <td className="p-4">
                                {alumno.materias.length ? (
                                  <div className="space-y-2">
                                    {alumno.materias.map((materia) => (
                                      <div key={materia.claseId} className="flex flex-wrap items-center gap-2">
                                        <span>{materia.horaInicio} {materia.materia}</span>
                                        {getEstadoBadge(materia.estado || "sin registro")}
                                      </div>
                                    ))}
                                  </div>
                                ) : <span className="text-gray-400">Sin clases inscritas ese día</span>}
                              </td>
                              <td className="p-4">
                                {alumno.diferencias.length ? (
                                  <div className="space-y-2">
                                    {alumno.diferencias.map((diferencia) => (
                                      <div key={`${diferencia.materia}-${diferencia.horaInicio}`} className="flex items-start gap-2 text-amber-800">
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                        <span>
                                          {diferencia.estadoProfesor
                                            ? `${diferencia.materia}: general ${diferencia.estadoGeneral}, clase ${diferencia.estadoProfesor}`
                                            : `${diferencia.materia}: el docente aún no cargó la asistencia`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : <span className="text-gray-400">Sin diferencias registradas</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-400">No hay alumnos para mostrar.</div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  La comparación solo informa diferencias; no modifica ni reemplaza las asistencias cargadas por los docentes.
                </p>
              </>
            )}
            {!comparacion && !loading && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                Selecciona un curso y una fecha para comparar los registros.
              </div>
            )}
          </section>
        ) : (
        /* Tabla de Resultados */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {asistencias.length > 0 ? (
             <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="p-4 border-b">Alumno</th>
                    <th className="p-4 border-b text-center">Estado</th>
                    <th className="p-4 border-b">Cargado Por</th>
                    <th className="p-4 border-b">Última Modificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {asistencias.map((asis) => (
                    <tr key={asis._id} className="hover:bg-blue-50 transition-colors">
                      
                      {/* Columna Alumno */}
                      <td className="p-4 font-medium text-gray-900">
                        {asis.alumno?.nombre || "Alumno desconocido"}
                      </td>

                      {/* Columna Estado */}
                      <td className="p-4 text-center">
                        {getEstadoBadge(asis.estado)}
                      </td>

                      {/* Columna Cargado Por (La parte importante) */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                            {asis.cargadoPor?.rol === 'admin' ? (
                                <ShieldCheck size={16} className="text-purple-600" title="Administrador" />
                            ) : (
                                <User size={16} className="text-gray-500" title="Profesor" />
                            )}
                            <div className="flex flex-col">
                                <span className={`font-semibold ${asis.cargadoPor?.rol === 'admin' ? 'text-purple-700' : 'text-gray-700'}`}>
                                    {asis.cargadoPor?.nombre || "Sistema"}
                                </span>
                                <span className="text-xs text-gray-400 uppercase">
                                    {asis.cargadoPor?.rol || "-"}
                                </span>
                            </div>
                        </div>
                      </td>

                      {/* Columna Fecha Hora */}
                      <td className="p-4 text-gray-500 flex items-center gap-2">
                        <Clock size={14}/>
                        {new Date(asis.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
            ) : (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <CalendarDays size={48} className="mb-4 text-gray-300"/>
                    <p className="text-lg font-medium">No hay datos para mostrar.</p>
                    <p className="text-sm">Selecciona una clase y una fecha arriba.</p>
                </div>
            )}
        </div>
        )}

      </div>
    </div>
  );
};

export default VerAsistenciasAdmin;