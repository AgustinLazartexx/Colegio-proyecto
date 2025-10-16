import React, { useEffect, useState, useCallback } from "react";
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
  Save, // NUEVO: Ícono para guardar
} from "lucide-react";

// NUEVO: Componente para manejar cada entrega individualmente
const EntregaCard = ({ entrega, onCorregir }) => {
  // Estado local para manejar los inputs de nota y comentario de forma controlada
  const [nota, setNota] = useState(entrega.nota ?? "");
  const [comentario, setComentario] = useState(entrega.comentario ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleGuardarCorreccion = async () => {
    if (nota !== "" && (nota < 0 || nota > 10)) {
      toast.error("La nota debe estar entre 0 y 10.");
      return;
    }
    setIsSaving(true);
    await onCorregir(entrega._id, nota, comentario);
    setIsSaving(false);
  };

  const getNotaColor = (n) => {
    if (n === null || n === undefined || n === "") return "bg-gray-100 text-gray-800";
    if (n >= 8) return "bg-green-100 text-green-800";
    if (n >= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
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
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getNotaColor(entrega.nota)}`}>
            {entrega.nota !== null && entrega.nota !== undefined ? `Nota: ${entrega.nota}` : "Sin corregir"}
          </span>
        </div>

        <div className="mt-4 mb-6">
          {entrega.archivo ? (
            <a href={`http://localhost:5000/uploads/${entrega.archivo}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline transition-colors">
              <Download size={20} /> Descargar archivo
            </a>
          ) : (
            <p className="text-gray-500 italic flex items-center gap-2">
              <AlertTriangle size={16} /> No hay archivo adjunto.
            </p>
          )}
        </div>

        <div className="space-y-4 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-start">
            <div>
              <label className="block font-semibold mb-2 text-gray-700">Nota:</label>
              <input type="number"
                className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                min="0" max="10" step="0.1" placeholder="0-10" />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-gray-700">Comentario:</label>
              <textarea
                className="border border-gray-300 w-full px-4 py-2 rounded-lg resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows="3" placeholder="Añadir comentario..."/>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGuardarCorreccion}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {isSaving ? "Guardando..." : "Guardar Corrección"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const VerEntregas = () => {
  const { usuario, token, authCargando } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [entregas, setEntregas] = useState([]);
  // CAMBIO: Estados de carga más específicos para una mejor experiencia de usuario
  const [loadingTareas, setLoadingTareas] = useState(true);
  const [loadingEntregas, setLoadingEntregas] = useState(false);
  const [error, setError] = useState(null);

  // CAMBIO: Se usa 'useCallback' para memorizar la función y evitar re-renders innecesarios
  const fetchTareas = useCallback(async (userId, authToken) => {
    try {
      setLoadingTareas(true);
      setError(null);
      // CAMBIO: Se usa la ruta correcta y única del backend. No más doble 'try/catch'.
      const res = await axios.get(`http://localhost:5000/api/tareas/by-profesor/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setTareas(res.data || []);
    } catch (err) {
      console.error("Error al cargar tareas:", err.response?.data || err.message);
      setError("Error al cargar las tareas. Verifica que el backend esté funcionando correctamente.");
      toast.error("Error al cargar las tareas.");
    } finally {
      setLoadingTareas(false);
    }
  }, []);

  useEffect(() => {
  console.log("--- DEBUG INICIADO ---");
  console.log("Usuario recibido del contexto:", usuario);
  console.log("Token recibido del contexto:", token);

  if (authCargando) {
    console.log("ACCIÓN: authCargando es true, no se hace nada todavía.");
    return;
  }

  // Extraemos el ID aquí para verificarlo
  const userId = usuario?.id;
  
  console.log("Valor de 'userId' extraído:", userId);
  console.log("Valor de 'token':", token);

  // Forzamos la evaluación de la condición a un booleano explícito
  const laCondicionEsVerdadera = !!(userId && token);
  console.log("¿La condición (userId && token) es VERDADERA?:", laCondicionEsVerdadera);

  if (laCondicionEsVerdadera) {
    console.log("ACCIÓN: La condición es VERDADERA. Se llamará a fetchTareas.");
    fetchTareas(userId, token);
  } else {
    console.log("ACCIÓN: La condición es FALSA. Se mostrará el error en pantalla.");
    setError("No hay un usuario autenticado o falta el token.");
    setLoadingTareas(false);
  }
  
  console.log("--- DEBUG FINALIZADO ---");

}, [authCargando, usuario, token, fetchTareas]);

  const handleSeleccionarTarea = async (tareaId) => {
    if (!tareaId) {
      setTareaSeleccionada(null);
      setEntregas([]);
      return;
    }
    setTareaSeleccionada(tareaId);
    setLoadingEntregas(true); // Usar el loader específico
    try {
      // CAMBIO: Se usa la ruta correcta y única del backend.
      const res = await axios.get(`http://localhost:5000/api/entregas/tarea/${tareaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntregas(res.data || []);
    } catch (err) {
      console.error("Error al cargar entregas:", err.response?.data || err.message);
      toast.error("Error al cargar las entregas.");
      setEntregas([]);
    } finally {
      setLoadingEntregas(false);
    }
  };
  
  // CAMBIO: La lógica de corregir se pasa como prop al componente hijo 'EntregaCard'.
  const handleCorregir = async (entregaId, nota, comentario) => {
    try {
      await axios.put(
        `http://localhost:5000/api/entregas/${entregaId}`,
        { nota: nota === "" ? null : nota, comentario }, // Enviar null si la nota está vacía
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Entrega corregida con éxito.");
      // Actualizar el estado local para reflejar el cambio instantáneamente
      setEntregas((prev) =>
        prev.map((e) => (e._id === entregaId ? { ...e, nota, comentario } : e))
      );
    } catch (err) {
      console.error("Error al corregir entrega:", err.response?.data || err.message);
      toast.error("Error al corregir la entrega.");
    }
  };
  
  // Renders de estados de carga y error
  if (authCargando || loadingTareas) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-gray-600 font-medium">
        {authCargando ? "Cargando autenticación..." : "Cargando tareas..."}
      </p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-red-900 mb-2">Error al cargar datos</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105">
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="p-3 bg-blue-600 rounded-full">
              <Book className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Gestor de Entregas</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Selecciona una tarea para ver y calificar las entregas de tus estudiantes.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            Seleccionar Tarea:
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            onChange={(e) => handleSeleccionarTarea(e.target.value)}
            value={tareaSeleccionada || ""}
          >
            <option value="">-- Selecciona una tarea --</option>
            {tareas.map((tarea) => (
              <option key={tarea._id} value={tarea._id}>
                {tarea.titulo}
              </option>
            ))}
          </select>
          {tareas.length === 0 && !loadingTareas && (
            <p className="mt-4 text-center text-gray-500 italic">No tienes tareas creadas.</p>
          )}
        </div>

        {tareaSeleccionada && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={24} /> Entregas de la Tarea
            </h2>

            {loadingEntregas ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : entregas.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
                <p className="text-gray-600 font-medium">No hay entregas para esta tarea todavía.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {entregas.map((entrega) => (
                  <EntregaCard key={entrega._id} entrega={entrega} onCorregir={handleCorregir} />
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