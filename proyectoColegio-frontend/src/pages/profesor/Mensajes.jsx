// src/pages/comunicaciones/Mensajes.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { 
  Send, 
  Megaphone, 
  Book,
  User,
  Calendar,
  MessageCircle,
  AlertCircle,
  BookOpen,
  Clock
} from "lucide-react";

const Mensajes = () => {
  const { token, usuario } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [form, setForm] = useState({ materia: "", titulo: "", mensaje: "" });
  const [loading, setLoading] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);

  // 🔹 Si es profesor: cargar materias que dicta
  // 🔹 Si es alumno: cargar anuncios de sus materias
  useEffect(() => {
    if (!usuario?.rol || !token) return;
    setLoading(true);

    if (usuario.rol === "profesor") {
      axios
        .get("http://localhost:5000/api/materias/profesor/materias", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setMaterias(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error al cargar materias", err);
          setLoading(false);
        });
    } else if (usuario.rol === "alumno") {
      axios
        .get(`http://localhost:5000/api/anuncios/alumno/${usuario.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setAnuncios(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error al cargar anuncios", err);
          setLoading(false);
        });
    }
  }, [usuario, token]);

  // 🔹 Crear anuncio (profesor)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/anuncios", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ materia: "", titulo: "", mensaje: "" });
      setSelectedMateria(null);
      // Aquí podrías agregar una notificación toast en lugar de alert
      alert("📢 Anuncio enviado correctamente");
    } catch (error) {
      console.error("Error al enviar anuncio", error);
      alert("❌ No se pudo enviar el anuncio");
    } finally {
      setLoading(false);
    }
  };

  const handleMateriaChange = (e) => {
    const materiaId = e.target.value;
    const materia = materias.find(m => m._id === materiaId);
    setSelectedMateria(materia);
    setForm({ ...form, materia: materiaId });
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

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Megaphone className="text-white" size={28} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              {usuario?.rol === "profesor" ? "Centro de Comunicaciones" : "Mis Anuncios"}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {usuario?.rol === "profesor" 
              ? "Mantén informados a tus estudiantes con anuncios importantes"
              : "Mantente al día con las últimas comunicaciones de tus profesores"
            }
          </p>
        </div>

        {/* PROFESOR: Formulario para enviar anuncio */}
        {usuario?.rol === "profesor" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-white" size={24} />
                <h2 className="text-2xl font-bold text-white">Crear Nuevo Anuncio</h2>
              </div>
              <p className="text-blue-100 mt-2">Comparte información importante con tus estudiantes</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selector de materia */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen size={16} />
                    Materia
                  </label>
                  <div className="relative">
                    <select
                      value={form.materia}
                      onChange={handleMateriaChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all appearance-none bg-white text-gray-900"
                      required
                    >
                      <option value="">Seleccionar materia...</option>
                      {materias.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedMateria && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                      <p className="text-blue-800 text-sm font-medium">
                        📚 {selectedMateria.nombre}
                      </p>
                    </div>
                  )}
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <AlertCircle size={16} />
                    Título del Anuncio
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Examen parcial programado, Nueva tarea asignada..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MessageCircle size={16} />
                    Mensaje
                  </label>
                  <textarea
                    value={form.mensaje}
                    onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    placeholder="Escribe aquí los detalles de tu anuncio. Sé claro y específico para que tus estudiantes entiendan la información importante."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                    rows={6}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    {form.mensaje.length}/500 caracteres
                  </p>
                </div>

                {/* Botón enviar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Send size={20} />
                    {loading ? "Enviando..." : "Publicar Anuncio"}
                  </div>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ALUMNO: Lista de anuncios */}
        {usuario?.rol === "alumno" && (
          <div className="space-y-6">
            {anuncios.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <MessageCircle size={40} className="text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No hay anuncios disponibles
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Cuando tus profesores publiquen anuncios importantes, los verás aquí. 
                  ¡Mantente atento a las actualizaciones!
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Anuncios Recientes ({anuncios.length})
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    Última actualización: {new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                  </div>
                </div>
                
                {anuncios.map((anuncio) => (
                  <div
                    key={anuncio._id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-300"
                  >
                    {/* Header del anuncio */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {anuncio.titulo}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Book size={16} />
                              <span className="font-medium">{anuncio.materia?.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-700">
                              <User size={16} />
                              <span>{anuncio.profesor?.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar size={16} />
                              <span>{formatDate(anuncio.fecha)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                          {getTimeAgo(anuncio.fecha)}
                        </div>
                      </div>
                    </div>

                    {/* Contenido del anuncio */}
                    <div className="p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {anuncio.mensaje}
                      </p>
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

export default Mensajes;