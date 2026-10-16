// src/pages/profesor/CrudAnunciosProfesor.jsx
import { useEffect, useState } from "react";
import { 
  getMisAnuncios, 
  getMateriasProfesor, 
  crearAnuncio, 
  actualizarAnuncio, 
  eliminarAnuncio 
} from "../../api/api";
import { Pencil, Trash2, Megaphone, Save, X, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "react-toastify"; // Asumiendo que usas react-toastify

const CrudAnunciosProfesor = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para crear/editar
  const [modoEdicion, setModoEdicion] = useState(false);
  const [anuncioId, setAnuncioId] = useState(null);
  const [form, setForm] = useState({ materia: "", titulo: "", mensaje: "" });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resAnuncios, resMaterias] = await Promise.all([
        getMisAnuncios(),
        getMateriasProfesor()
      ]);
      setAnuncios(resAnuncios.data);
      setMaterias(resMaterias.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar información");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.materia || !form.titulo || !form.mensaje) {
      return toast.warning("Todos los campos son obligatorios");
    }

    try {
      if (modoEdicion) {
        const res = await actualizarAnuncio(anuncioId, form);
        setAnuncios(prev => prev.map(a => a._id === anuncioId ? res.data : a));
        toast.success("Anuncio actualizado");
      } else {
        const res = await crearAnuncio(form);
        setAnuncios(prev => [res.data, ...prev]);
        toast.success("Anuncio creado");
      }
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Error al guardar");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este anuncio?")) return;
    try {
      await eliminarAnuncio(id);
      setAnuncios(prev => prev.filter(a => a._id !== id));
      toast.success("Anuncio eliminado");
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  const handleEditar = (anuncio) => {
    setModoEdicion(true);
    setAnuncioId(anuncio._id);
    setForm({
      materia: anuncio.materia?._id || anuncio.materia,
      titulo: anuncio.titulo,
      mensaje: anuncio.mensaje
    });
    // Scroll hacia el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setModoEdicion(false);
    setAnuncioId(null);
    setForm({ materia: "", titulo: "", mensaje: "" });
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Megaphone className="text-blue-600 w-8 h-8" />
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Anuncios</h1>
            <p className="text-gray-500">Crea avisos importantes para tus materias</p>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">
            {modoEdicion ? "Editar Anuncio" : "Nuevo Anuncio"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={form.materia}
                        onChange={e => setForm({...form, materia: e.target.value})}
                    >
                        <option value="">Seleccionar Materia</option>
                        {materias.map(mat => (
                            <option key={mat._id} value={mat._id}>{mat.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej: Examen Parcial"
                        value={form.titulo}
                        onChange={e => setForm({...form, titulo: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea 
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Escribe el contenido del anuncio..."
                    value={form.mensaje}
                    onChange={e => setForm({...form, mensaje: e.target.value})}
                ></textarea>
            </div>
            <div className="flex gap-2 justify-end">
                {modoEdicion && (
                    <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Cancelar
                    </button>
                )}
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Save size={18} /> {modoEdicion ? "Actualizar" : "Publicar"}
                </button>
            </div>
        </form>
      </div>

      {/* LISTADO */}
      <div className="space-y-4">
        {anuncios.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <MessageSquare className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                <p className="text-gray-500">No has publicado anuncios todavía.</p>
             </div>
        ) : anuncios.map(anuncio => (
            <div key={anuncio._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                            {anuncio.materia?.nombre || "Materia eliminada"}
                        </span>
                        <span className="text-gray-400 text-xs">
                            {new Date(anuncio.fecha).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">{anuncio.titulo}</h3>
                    <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{anuncio.mensaje}</p>
                </div>
                <div className="flex items-start gap-2">
                    <button onClick={() => handleEditar(anuncio)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                        <Pencil size={18} />
                    </button>
                    <button onClick={() => handleEliminar(anuncio._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default CrudAnunciosProfesor;