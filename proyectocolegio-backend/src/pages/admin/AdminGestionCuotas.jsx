import React, { useState, useEffect } from "react";
import { X, Plus, DollarSign, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import { getCuotasDeAlumno, generarCuota, registrarPagoCuota, marcarCuotaVencida } from "../../api/api";

const AdminGestionCuotas = ({ alumno, onClose }) => {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de nueva cuota
  const [nuevaCuota, setNuevaCuota] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    monto: "",
    fechaVencimiento: ""
  });

  useEffect(() => {
    cargarCuotas();
  }, [alumno]);

  const cargarCuotas = async () => {
    try {
      const res = await getCuotasDeAlumno(alumno._id);
      setCuotas(res.data);
    } catch (error) {
      toast.error("Error al cargar historial de cuotas");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async (e) => {
    e.preventDefault();
    if (!nuevaCuota.monto || !nuevaCuota.fechaVencimiento) return toast.warning("Complete monto y vencimiento");

    try {
      await generarCuota({ ...nuevaCuota, alumnoId: alumno._id });
      toast.success("Cuota generada correctamente");
      cargarCuotas(); // Recargar lista
    } catch (error) {
      toast.error(error.response?.data?.msg || "Error al generar cuota");
    }
  };

  const handlePagar = async (cuotaId) => {
    if (!window.confirm("¿Confirmar recepción del pago?")) return;
    try {
      const res = await registrarPagoCuota(cuotaId, "efectivo"); // Podrías agregar un selector de método
      toast.success(res.data.msg);
      cargarCuotas();
    } catch (error) {
      toast.error("Error al registrar pago");
    }
  };

  const handleVencer = async (cuotaId) => {
      try {
          await marcarCuotaVencida(cuotaId);
          toast.info("Cuota marcada como vencida");
          cargarCuotas();
      } catch (error) {
          toast.error("Error al actualizar");
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="text-green-400"/> Gestión Financiera
            </h2>
            <p className="text-gray-300 mt-1">Alumno: <span className="font-bold text-white">{alumno.nombre}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col md:flex-row gap-6">
          
          {/* COLUMNA IZQ: Generar Nueva Cuota */}
          <div className="md:w-1/3 space-y-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-600"/> Nueva Cuota
              </h3>
              <form onSubmit={handleGenerar} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes y Año</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" min="1" max="12" 
                      value={nuevaCuota.mes}
                      onChange={e => setNuevaCuota({...nuevaCuota, mes: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Mes"
                    />
                    <input 
                      type="number" min="2020" max="2030" 
                      value={nuevaCuota.anio}
                      onChange={e => setNuevaCuota({...nuevaCuota, anio: e.target.value})}
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Año"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto ($)</label>
                  <input 
                    type="number" 
                    value={nuevaCuota.monto}
                    onChange={e => setNuevaCuota({...nuevaCuota, monto: e.target.value})}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Ej: 15000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vencimiento</label>
                  <input 
                    type="date" 
                    value={nuevaCuota.fechaVencimiento}
                    onChange={e => setNuevaCuota({...nuevaCuota, fechaVencimiento: e.target.value})}
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium text-sm">
                  Generar Cuota
                </button>
              </form>
            </div>
          </div>

          {/* COLUMNA DER: Historial */}
          <div className="md:w-2/3">
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-700">Historial de Pagos</h3>
                </div>
                
                {loading ? <p className="p-4 text-center">Cargando...</p> : cuotas.length === 0 ? (
                    <p className="p-8 text-center text-gray-500">No hay cuotas registradas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="p-3">Periodo</th>
                                    <th className="p-3">Monto</th>
                                    <th className="p-3">Vencimiento</th>
                                    <th className="p-3">Estado</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cuotas.map(c => (
                                    <tr key={c._id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{c.mes}/{c.anio}</td>
                                        <td className="p-3">${c.monto}</td>
                                        <td className="p-3 text-gray-500">
                                            {new Date(c.fechaVencimiento).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                c.estado === 'pagado' ? 'bg-green-100 text-green-700' :
                                                c.estado === 'vencido' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {c.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            {c.estado !== 'pagado' && (
                                                <button 
                                                    onClick={() => handlePagar(c._id)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs shadow-sm mr-2"
                                                    title="Registrar Pago"
                                                >
                                                    Cobrar
                                                </button>
                                            )}
                                            {c.estado === 'pendiente' && (
                                                <button 
                                                    onClick={() => handleVencer(c._id)}
                                                    className="text-red-400 hover:text-red-600 text-xs"
                                                    title="Forzar Vencimiento"
                                                >
                                                    <AlertCircle size={16}/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGestionCuotas;