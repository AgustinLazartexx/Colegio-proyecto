import { useEffect, useState } from "react";
import { Pencil, Trash2, Megaphone, Save, X, Calendar, BookOpen, MessageSquare } from "lucide-react";

// Funciones API
const API_BASE_URL = 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const obtenerMisAnuncios = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/anuncios/profesor/mis-anuncios`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Error al obtener anuncios');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en obtenerMisAnuncios:', error);
    throw error;
  }
};

const obtenerMateriasProfesor = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/materias/profesor/materias`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Error al obtener materias');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en obtenerMateriasProfesor:', error);
    throw error;
  }
};

const actualizarAnuncioAPI = async (id, datosAnuncio) => {
  try {
    const response = await fetch(`${API_BASE_URL}/anuncios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datosAnuncio)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Error al actualizar anuncio');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en actualizarAnuncio:', error);
    throw error;
  }
};

const eliminarAnuncioAPI = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/anuncios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Error al eliminar anuncio');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en eliminarAnuncio:', error);
    throw error;
  }
};

const CrudAnunciosProfesor = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [materias, setMaterias] = useState([]);
  
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ materia: "", titulo: "", mensaje: "" });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Cargar anuncios y materias en paralelo
      const [anunciosData, materiasData] = await Promise.all([
        obtenerMisAnuncios(),
        obtenerMateriasProfesor()
      ]);
      
      setAnuncios(anunciosData);
      setMaterias(materiasData);
    } catch (error) {
      setError(error.message);
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const cargarAnuncios = async () => {
    try {
      setCargando(true);
      setError(null);
      const anunciosData = await obtenerMisAnuncios();
      setAnuncios(anunciosData);
    } catch (error) {
      setError(error.message);
      console.error("Error al cargar anuncios:", error);
    } finally {
      setCargando(false);
    }
  };

  // Iniciar edición
  const iniciarEdicion = (anuncio) => {
    setEditando(anuncio._id);
    setForm({
      materia: anuncio.materia?._id || "",
      titulo: anuncio.titulo,
      mensaje: anuncio.mensaje,
    });
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditando(null);
    setForm({ materia: "", titulo: "", mensaje: "" });
  };

  // Guardar cambios
  const guardarCambios = async (id) => {
    try {
      await actualizarAnuncioAPI(id, form);
      
      // Actualizar el estado local con la materia populada
      const materiaSeleccionada = materias.find(m => m._id === form.materia);
      setAnuncios((prev) =>
        prev.map((a) => 
          a._id === id 
            ? { 
                ...a, 
                titulo: form.titulo,
                mensaje: form.mensaje,
                materia: materiaSeleccionada || a.materia
              } 
            : a
        )
      );
      cancelarEdicion();
      
      // ✅ ALERTA DE ÉXITO AL EDITAR
      alert("✅ Anuncio actualizado correctamente");
      
    } catch (error) {
      console.error("Error al actualizar anuncio:", error);
      setError(error.message);
      // ❌ ALERTA DE ERROR AL EDITAR
      alert("❌ Error al actualizar el anuncio: " + error.message);
    }
  };

  // Eliminar anuncio
  const eliminarAnuncio = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este anuncio?")) return;
    
    try {
      await eliminarAnuncioAPI(id);
      setAnuncios((prev) => prev.filter((a) => a._id !== id));
      
      // ✅ ALERTA DE ÉXITO AL ELIMINAR
      alert("✅ Anuncio eliminado correctamente");
      
    } catch (error) {
      console.error("Error al eliminar anuncio:", error);
      setError(error.message);
      // ❌ ALERTA DE ERROR AL ELIMINAR
      alert("❌ Error al eliminar el anuncio: " + error.message);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando anuncios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Megaphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Mis Anuncios</h1>
                <p className="text-gray-500 text-sm">Gestiona tus comunicaciones con los estudiantes</p>
              </div>
            </div>
            <button
              onClick={cargarDatos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Mostrar errores */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Estado de carga de materias */}
        {materias.length === 0 && !cargando && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                No tienes materias asignadas. Contacta al administrador para que te asigne materias.
              </p>
            </div>
          </div>
        )}

        {/* Lista de anuncios */}
        {anuncios.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes anuncios</h3>
            <p className="text-gray-500">Crea tu primer anuncio para comunicarte con tus estudiantes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {anuncios.map((anuncio) => (
              <div
                key={anuncio._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {editando === anuncio._id ? (
                  // Modo edición
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Materia
                        </label>
                        <select
                          value={form.materia}
                          onChange={(e) => setForm({ ...form, materia: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="">Seleccionar materia</option>
                          {materias.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título
                        </label>
                        <input
                          type="text"
                          value={form.titulo}
                          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mensaje
                        </label>
                        <textarea
                          value={form.mensaje}
                          onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={cancelarEdicion}
                          className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </button>
                        <button
                          onClick={() => guardarCambios(anuncio._id)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {anuncio.titulo}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {anuncio.mensaje}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {anuncio.materia?.nombre}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(anuncio.fecha).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => iniciarEdicion(anuncio)}
                          className="inline-flex items-center px-3 py-1.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarAnuncio(anuncio._id)}
                          className="inline-flex items-center px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrudAnunciosProfesor;