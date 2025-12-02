import React, { useEffect, useState } from "react";
import SidebarAlumno from "../../components/sidebar/SidebarAlumno";
import { getMisAsistenciasAlumno } from "../../api/api";
import { CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";

const Asistencias = () => {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsistencias = async () => {
      try {
        const res = await getMisAsistenciasAlumno();
        setDatos(res.data);
      } catch (error) {
        console.error("Error cargando asistencias:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAsistencias();
  }, []);

  const getStatusColor = (estado) => {
    switch (estado) {
      case "Presente": return "text-green-600 bg-green-100";
      case "Ausente": return "text-red-600 bg-red-100";
      case "Tarde": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case "Presente": return <CheckCircle size={18} />;
      case "Ausente": return <XCircle size={18} />;
      case "Tarde": return <AlertCircle size={18} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Mis Asistencias</h1>

        {loading ? (
          <p>Cargando registros...</p>
        ) : !datos || datos.historial.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center text-gray-500">
            No hay registros de asistencia aún.
          </div>
        ) : (
          <>
            {/* --- TARJETA DE RESUMEN (KPI) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm font-medium">Porcentaje Global</p>
                <p className={`text-4xl font-bold mt-2 ${datos.resumen.porcentaje < 75 ? 'text-red-500' : 'text-blue-600'}`}>
                  {datos.resumen.porcentaje}%
                </p>
                <p className="text-xs text-gray-400 mt-1">De asistencia total</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                 <p className="text-gray-500 text-sm font-medium">Clases Presente</p>
                 <p className="text-4xl font-bold text-green-600 mt-2">{datos.resumen.presentes}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gray-500">
                 <p className="text-gray-500 text-sm font-medium">Clases Totales</p>
                 <p className="text-4xl font-bold text-gray-600 mt-2">{datos.resumen.total}</p>
              </div>
            </div>

            {/* --- TABLA DE HISTORIAL --- */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar size={20} className="text-accent"/> Historial Detallado
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Materia</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datos.historial.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-700">
                          {new Date(item.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {item.materia}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.estado)}`}>
                            {getStatusIcon(item.estado)}
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.observacion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Asistencias;