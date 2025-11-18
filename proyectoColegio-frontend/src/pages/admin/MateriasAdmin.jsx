import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Plus, Search, Edit2, Trash2, BookOpen, X, Save, Loader2, User } from "lucide-react";
import Swal from "sweetalert2";

// IMPORTAR DESDE API.JS
import { 
  getMaterias, 
  createMateria, 
  updateMateria, 
  deleteMateria, 
  getProfesores 
} from "../../api/api";

const MateriasAdmin = () => {
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMateria, setEditingMateria] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "", anio: "", division: "", profesor: ""
  });

  const anios = [1, 2, 3, 4, 5, 6];
  const divisiones = ["A", "B", "C"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMaterias, resProfesores] = await Promise.all([
        getMaterias(),
        getProfesores()
      ]);
      setMaterias(resMaterias.data || []);
      // Filtramos solo por si getProfesores devuelve todos los usuarios
      const profes = resProfesores.data || [];
      setProfesores(profes.filter(p => p.rol === 'profesor')); 
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (materia = null) => {
    if (materia) {
      setEditingMateria(materia);
      setFormData({
        nombre: materia.nombre,
        anio: materia.anio,
        division: materia.division || "",
        profesor: materia.profesor?._id || materia.profesor || ""
      });
    } else {
      setEditingMateria(null);
      setFormData({ nombre: "", anio: "", division: "", profesor: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Asegurar que el profesor vacío se envíe como null o no se envíe si el backend lo requiere
      const payload = { ...formData };
      if (!payload.profesor) delete payload.profesor;

      if (editingMateria) {
        await updateMateria(editingMateria._id, payload);
        toast.success("Materia actualizada");
      } else {
        await createMateria(payload);
        toast.success("Materia creada");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.msg || "Error al guardar";
      toast.error(msg);
    }
  };

  const handleDelete = (materia) => {
    Swal.fire({
      title: "¿Eliminar materia?",
      text: "Se eliminará permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      confirmButtonColor: "#d33"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteMateria(materia._id);
          setMaterias(prev => prev.filter(m => m._id !== materia._id));
          Swal.fire("Eliminada", "", "success");
        } catch (error) {
          toast.error("Error al eliminar");
        }
      }
    });
  };

  const filteredMaterias = materias.filter(m => 
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen /> Gestión de Materias</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex gap-2">
          <Plus /> Nueva Materia
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Buscar materia..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterias.map(materia => (
          <div key={materia._id} className="bg-white p-5 rounded shadow hover:shadow-md relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(materia)} className="text-gray-500 hover:text-blue-600"><Edit2 size={18}/></button>
              <button onClick={() => handleDelete(materia)} className="text-gray-500 hover:text-red-600"><Trash2 size={18}/></button>
            </div>
            <h3 className="font-bold text-lg">{materia.nombre}</h3>
            <div className="flex gap-2 my-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{materia.anio}° Año</span>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Div. {materia.division}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-gray-600 text-sm">
              <User size={16} />
              {materia.profesor ? `${materia.profesor.nombre} ${materia.profesor.apellido || ''}` : 'Sin asignar'}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
             <div className="flex justify-between mb-4">
               <h3 className="font-bold text-lg">{editingMateria ? "Editar" : "Nueva"} Materia</h3>
               <button onClick={() => setShowModal(false)}><X /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
               <input className="w-full p-2 border rounded" placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
               <div className="grid grid-cols-2 gap-4">
                 <select className="p-2 border rounded" value={formData.anio} onChange={e => setFormData({...formData, anio: e.target.value})} required>
                   <option value="">Año</option>
                   {anios.map(a => <option key={a} value={a}>{a}°</option>)}
                 </select>
                 <select className="p-2 border rounded" value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} required>
                   <option value="">División</option>
                   {divisiones.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               </div>
               <select className="w-full p-2 border rounded" value={formData.profesor} onChange={e => setFormData({...formData, profesor: e.target.value})}>
                 <option value="">-- Profesor --</option>
                 {profesores.map(p => <option key={p._id} value={p._id}>{p.nombre} {p.apellido}</option>)}
               </select>
               <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Guardar</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MateriasAdmin;