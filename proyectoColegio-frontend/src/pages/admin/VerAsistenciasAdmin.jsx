import { useEffect, useState } from "react";
// import axios from "axios"; // <--- YA NO ES NECESARIO AXIOS AQUÍ SI USAS API.JS
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  CalendarDays,
  Filter,
  UserCheck,
  Search,
  Loader2,
  ShieldCheck,
  User,
  Clock
} from "lucide-react";

// 1. IMPORTAR LAS FUNCIONES DE TU API
import { getTodasLasClases, getReporteAsistencias } from "../../api/api"; 

const VerAsistenciasAdmin = () => {
  const { token } = useAuth();
  const [asistencias, setAsistencias] = useState([]);
  const [clases, setClases] = useState([]); 
  const [loading, setLoading] = useState(false);

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
  }, []); // Ya no necesitas depender de [token] porque api.js maneja el interceptor

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
            <p className="text-gray-500">Consulta quién cargó la asistencia y el estado de los alumnos.</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
            <Filter size={20} />
            <h2>Seleccionar Clase y Fecha</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Clase */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clase / Materia</label>
               <select
  value={filtros.claseId}
  onChange={(e) => setFiltros({ ...filtros, claseId: e.target.value })}
  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
>
  <option value="">-- Selecciona una clase --</option>
  
  {/* 👇 AQUÍ ESTÁ LA CORRECCIÓN CLAVE 👇 */}
  {clases.map((c) => (
    <option 
      key={c._id || c.id}      // Usa _id (Mongoose estándar) o id si tu back lo transforma
      value={c._id || c.id}    // IMPORTANTE: Esto asegura que se envíe el ID, no el nombre
    >
      {/* Lo que se ve en pantalla */}
      {c.materia?.nombre || "Materia"} - {c.anio}° {c.division} ({c.diaSemana})
    </option>
  ))}
  
</select>
            </div>

            {/* Selector de Fecha */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                    type="date"
                    value={filtros.fecha}
                    onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Botón Buscar */}
            <div className="flex items-end">
                <button
                    onClick={fetchReporte}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 h-[42px]"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                    Ver Reporte
                </button>
            </div>
          </div>
        </div>

        {/* Tabla de Resultados */}
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

      </div>
    </div>
  );
};

export default VerAsistenciasAdmin;