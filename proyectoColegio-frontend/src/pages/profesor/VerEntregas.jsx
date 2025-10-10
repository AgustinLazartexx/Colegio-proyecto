import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  Book,
  FileText,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Loader2,
  ListPlus,
  ArrowRight,
} from "lucide-react";

const VerEntregas = () => {
  const { usuario, token, authCargando } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authCargando) {
      setLoading(true);
      return;
    }

    const userId = usuario?.id || usuario?._id;
    if (!userId || !token) {
      setError("No hay usuario autenticado.");
      setLoading(false);
      return;
    }

    const fetchTareas = async () => {
      try {
        setLoading(true);
        setError(null);

        let res;
        try {
          res = await axios.get(`http://localhost:5000/api/tareas/profesor/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (firstError) {
          console.warn("Primera ruta falló, intentando ruta alternativa...");
          res = await axios.get(`http://localhost:5000/api/tareas/by-profesor/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setTareas(res.data || []);
      } catch (err) {
        console.error("Error al cargar tareas:", err.response?.data || err.message);
        setError("Error al cargar las tareas del profesor. Verificá que el backend esté funcionando.");
        toast.error("Error al cargar las tareas del profesor.");
      } finally {
        setLoading(false);
      }
    };

    fetchTareas();
  }, [authCargando, usuario?.id, usuario?._id, token]);

  const handleSeleccionarTarea = async (tareaId) => {
    if (!tareaId) {
      setTareaSeleccionada(null);
      setEntregas([]);
      return;
    }

    setTareaSeleccionada(tareaId);
    setLoading(true); // Se agrega estado de carga para la seleccion de tarea
    try {
      let res;
      try {
        res = await axios.get(`http://localhost:5000/api/entregas/${tareaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (firstError) {
        res = await axios.get(`http://localhost:5000/api/entregas/tarea/${tareaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setEntregas(res.data || []);
    } catch (err) {
      console.error("Error al cargar entregas:", err.response?.data || err.message);
      toast.error("Error al cargar las entregas.");
      setEntregas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCorregir = async (entregaId, nota, comentario) => {
    try {
      if (nota !== "" && (nota < 0 || nota > 10)) {
        toast.error("La nota debe estar entre 0 y 10.");
        return;
      }
      await axios.put(
        `http://localhost:5000/api/entregas/${entregaId}`,
        { nota, comentario },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Entrega corregida.");
      setEntregas((prev) =>
        prev.map((e) => (e._id === entregaId ? { ...e, nota, comentario } : e))
      );
    } catch (err) {
      console.error("Error al corregir entrega:", err.response?.data || err.message);
      toast.error("Error al corregir la entrega.");
    }
  };

  const getNotaColor = (nota) => {
    if (nota >= 8) return "bg-green-100 text-green-800";
    if (nota >= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authCargando) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-gray-600 font-medium">Cargando autenticación...</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-gray-600 font-medium">Cargando tareas...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-red-900 mb-2">Error al cargar datos</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
            <ListPlus size={20} /> Posibles soluciones:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-2 list-disc list-inside">
            <li>Verificá que el backend esté corriendo en `http://localhost:5000`.</li>
            <li>Confirmá que las rutas de la API son correctas.</li>
            <li>Revisá la consola del navegador y los logs del servidor.</li>
            <li>Asegúrate de que el usuario tenga los permisos de profesor.</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  if (!usuario) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <p className="text-gray-700 font-semibold text-lg">
          No hay usuario autenticado. Por favor, iniciá sesión.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header de la Página */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="p-3 bg-blue-600 rounded-full">
              <Book className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestor de Entregas
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Seleccioná una tarea para ver y calificar las entregas de tus estudiantes.
          </p>
        </div>

        {/* Selector de Tarea */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="block text-lg font-semibold text-gray-800">
              Seleccionar Tarea:
            </label>
            <select
              className="flex-grow md:flex-grow-0 border border-gray-300 rounded-lg px-4 py-3 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              onChange={(e) => handleSeleccionarTarea(e.target.value)}
              value={tareaSeleccionada || ""}
            >
              <option value="">-- Seleccioná una tarea --</option>
              {tareas.map((tarea) => (
                <option key={tarea._id || tarea.id} value={tarea._id || tarea.id}>
                  {tarea.titulo}
                </option>
              ))}
            </select>
          </div>
          {tareas.length === 0 && (
            <div className="mt-4 text-center text-gray-500 italic">
              <p>No tienes tareas asignadas aún.</p>
            </div>
          )}
        </div>

        {/* Sección de Entregas */}
        {tareaSeleccionada && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={24} />
              Entregas de la Tarea
            </h2>

            {entregas.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">
                  No hay entregas para esta tarea.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {entregas.map((entrega) => (
                  <div
                    key={entrega._id || entrega.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <User size={24} className="text-blue-600" />
                          <div>
                            <p className="font-bold text-lg text-gray-900">
                              {entrega.alumno?.nombre || "N/A"} {entrega.alumno?.apellido || ""}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock size={14} /> Entregado el {formatDate(entrega.fecha)}
                            </p>
                          </div>
                        </div>
                        {entrega.nota && (
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getNotaColor(entrega.nota)}`}>
                            Corregida
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-4">
                        {entrega.archivo && (
                          <a
                            href={`http://localhost:5000/uploads/${entrega.archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline transition-colors"
                          >
                            <Download size={20} /> Descargar archivo
                          </a>
                        )}
                        {!entrega.archivo && (
                          <p className="text-gray-500 italic flex items-center gap-2">
                            <AlertTriangle size={16} /> No hay archivo adjunto.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
                        <div>
                          <label className="block font-semibold mb-2 text-gray-700">Nota (0-10):</label>
                          <input
                            type="number"
                            className="border border-gray-300 px-4 py-2 rounded-lg w-full max-w-[120px] focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                            defaultValue={entrega.nota || ""}
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="0-10"
                            onBlur={(e) => handleCorregir(entrega._id || entrega.id, e.target.value, entrega.comentario)}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-2 text-gray-700">Comentario:</label>
                          <textarea
                            className="border border-gray-300 w-full px-4 py-2 rounded-lg resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                            defaultValue={entrega.comentario || ""}
                            rows="3"
                            placeholder="Añadir comentario..."
                            onBlur={(e) => handleCorregir(entrega._id || entrega.id, entrega.nota, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerEntregas;