import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; 
import {
  Edit3, Trash2, X, Loader2, AlertCircle, Save, GraduationCap, Plus, BookOpen, Filter, Search
} from "lucide-react";
import Swal from "sweetalert2"; 

// IMPORTAMOS DESDE API.JS (Centralizado)
import { 
  getTodasLasClases, 
  getMaterias, 
  getProfesores, 
  crearClase, 
  actualizarClase, 
  eliminarClase 
} from "../../api/api";

// Helper para manejar select múltiple
const getSelectedOptions = (options) => {
  const selectedValues = [];
  for (let i = 0, l = options.length; i < l; i++) {
    if (options[i].selected) {
      selectedValues.push(options[i].value);
    }
  }
  return selectedValues;
};

const ClasesAdmin = () => {
  const { token } = useAuth(); // Solo para verificar sesión
  const [clases, setClases] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    materia: "",
    profesores: [],
    diaSemana: "Lunes",
    horaInicio: "",
    horaFin: ""
  });

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ anio: "", diaSemana: "", division: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            await Promise.all([fetchClases(), fetchAuxiliaryData()]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    initData();
  }, [token]); 

  const fetchClases = async () => {
    try {
      // Si el backend soporta filtros por query params, se los pasamos
      const res = await getTodasLasClases(); 
      const data = res.data.clases || res.data || [];
      setClases(data); 
    } catch (err) {
      console.error("Error al cargar las clases:", err);
      Swal.fire("Error", "No se pudieron cargar las clases.", "error");
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [resMaterias, resProfesores] = await Promise.all([
        getMaterias(),
        getProfesores()
      ]);
      setMaterias(resMaterias.data || []);
      
      const listaProfes = resProfesores.data || [];
      // Si el endpoint devuelve todos los usuarios, filtramos. Si devuelve solo profes, usamos directo.
      setProfesoresList(listaProfes.filter(u => u.rol === 'profesor')); 

    } catch (err) {
      console.error("Error al cargar datos auxiliares:", err);
    }
  };

  // --- Manejo de formularios ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'materia') {
        const selectedMateria = materias.find(m => m._id === value);
        // Al seleccionar materia, guardamos su ID. 
        // Año y división son visuales, no necesitamos guardarlos en el estado del form si los derivamos.
        setForm(prev => ({ ...prev, materia: value }));
    } else {
        setForm({ ...form, [name]: value });
    }
  };

  const handleMultiSelectChange = (e) => {
    const selectedValues = getSelectedOptions(e.target.options);
    setForm(prev => ({ ...prev, profesores: selectedValues }));
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      materia: "",
      profesores: [],
      diaSemana: "Lunes",
      horaInicio: "",
      horaFin: ""
    });
    setEditingId(null);
    setShowModal(false);
  };

  const abrirModalEditar = (clase) => {
    const materiaId = clase.materia?._id || clase.materia || "";
    setEditingId(clase._id || clase.id);

    setForm({
      materia: materiaId,
      profesores: (clase.profesores || []).map(p => p._id || p),
      diaSemana: clase.diaSemana || "Lunes",
      horaInicio: clase.horaInicio || (clase.horario ? clase.horario.split(' - ')[0] : ""),
      horaFin: clase.horaFin || (clase.horario ? clase.horario.split(' - ')[1] : "")
    });
    setShowModal(true);
  };

  const abrirModalCrear = () => {
    resetForm();
    setShowModal(true);
  };

  // --- GUARDAR (Crear/Editar) ---
  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!form.materia || form.profesores.length === 0 || !form.horaInicio || !form.horaFin) {
        Swal.fire("Atención", "Por favor completa todos los campos obligatorios.", "warning");
        return;
    }

    const selectedMateria = materias.find(m => m._id === form.materia);
    if (!selectedMateria) return;

    const payload = {
        materia: form.materia,
        profesores: form.profesores,
        anio: selectedMateria.anio, 
        division: selectedMateria.division, 
        diaSemana: form.diaSemana,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
    };

    setLoadingAction(true);
    try {
      if (editingId) {
        await actualizarClase(editingId, payload);
        Swal.fire("¡Actualizado!", "Clase modificada.", "success");
      } else {
        await crearClase(payload);
        Swal.fire("¡Creado!", "Clase registrada.", "success");
      }
      resetForm();
      fetchClases(); 
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.msg || "Error al guardar.";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar"
    });

    if (!confirm.isConfirmed) return;

    try {
      await eliminarClase(id);
      Swal.fire("¡Eliminado!", "Clase eliminada.", "success");
      fetchClases();
    } catch (err) {
      Swal.fire("Error", "No se pudo eliminar.", "error");
    }
  };

  // --- Filtrado en memoria ---
  const clasesFiltradas = clases.filter(c => {
      const matchAnio = !filter.anio || String(c.anio) === String(filter.anio);
      const matchDiv = !filter.division || (c.division && c.division.toUpperCase() === filter.division.toUpperCase());
      const matchDia = !filter.diaSemana || c.diaSemana === filter.diaSemana;
      return matchAnio && matchDiv && matchDia;
  });

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const aniosAcademicos = [1, 2, 3, 4, 5, 6];
  const divisionesEjemplo = ["A", "B", "C"];
  const hasActiveFilters = filter.anio || filter.division || filter.diaSemana;

  return (
     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
       <div className="max-w-7xl mx-auto space-y-6">
         
         {/* Header */}
         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl">
               <GraduationCap size={32} />
             </div>
             <div>
               <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Gestión de Clases</h1>
               <p className="text-lg text-gray-600 mt-1">Administra horarios y asignaciones</p>
             </div>
           </div>
           
           <button onClick={abrirModalCrear} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition">
             <Plus size={20} /> Nueva Clase
           </button>
         </div>

         {/* Filtros */}
         <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
           <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition">
             <div className="flex items-center gap-3">
               <Filter size={20} className="text-indigo-600" />
               <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
               {hasActiveFilters && <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">Activos</span>}
             </div>
             <X size={20} className={`text-gray-400 transform transition-transform ${showFilters ? 'rotate-45' : ''}`} />
           </button>
           
           {showFilters && (
             <div className="p-5 border-t border-gray-100 bg-gray-50">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Año</label>
                   <select name="anio" value={filter.anio} onChange={handleFilterChange} className="w-full p-3 border rounded-lg text-sm">
                     <option value="">Todos</option>
                     {aniosAcademicos.map(a => <option key={a} value={a}>{a}°</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">División</label>
                   <select name="division" value={filter.division} onChange={handleFilterChange} className="w-full p-3 border rounded-lg text-sm">
                     <option value="">Todas</option>
                     {divisionesEjemplo.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Día</label>
                   <select name="diaSemana" value={filter.diaSemana} onChange={handleFilterChange} className="w-full p-3 border rounded-lg text-sm">
                     <option value="">Todos</option>
                     {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                 </div>
               </div>
               {hasActiveFilters && (
                  <button onClick={() => setFilter({ anio: "", diaSemana: "", division: "" })} className="mt-4 text-sm text-indigo-600 font-bold flex items-center gap-2">
                    <X size={16} /> Limpiar
                  </button>
               )}
             </div>
           )}
         </div>

         {/* Tabla */}
         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
           {loading ? (
             <div className="p-16 flex justify-center"><Loader2 size={48} className="animate-spin text-indigo-600" /></div>
           ) : clasesFiltradas.length === 0 ? (
             <div className="p-16 text-center">
               <AlertCircle size={40} className="text-gray-400 mx-auto mb-4" />
               <p className="text-xl font-bold text-gray-900">No se encontraron clases</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Materia</th>
                     <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Profesor(es)</th>
                     <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Curso</th>
                     <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Horario</th>
                     <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-100">
                   {clasesFiltradas.map((c) => (
                     <tr key={c._id || c.id} className="hover:bg-indigo-50 transition">
                       <td className="px-6 py-4 text-sm font-bold text-gray-900">{c.materia?.nombre || "N/A"}</td>
                       <td className="px-6 py-4 text-sm text-gray-700">
                         {(c.profesores || []).map(p => `${p.nombre} ${p.apellido || ''}`).join(', ') || "N/A"}
                       </td>
                       <td className="px-6 py-4 text-center">
                         <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                           {c.anio}° {c.division}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-sm font-medium">
                         {c.diaSemana} {c.horaInicio} - {c.horaFin}
                       </td>
                       <td className="px-6 py-4 text-center flex justify-center gap-3">
                         <button onClick={() => abrirModalEditar(c)} className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg"><Edit3 size={18}/></button>
                         <button onClick={() => handleEliminar(c._id || c.id)} className="text-red-600 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18}/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
      
       {/* Modal */}
       {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button onClick={resetForm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
              <h3 className="text-xl font-bold text-gray-900 mb-6">{editingId ? "Editar Clase" : "Crear Clase"}</h3>

              <form onSubmit={handleGuardar} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Materia *</label>
                  <select name="materia" value={form.materia} onChange={handleInputChange} required className="w-full p-3 border rounded-xl text-sm">
                    <option value="">Seleccionar...</option>
                    {materias.map((m) => (
                      <option key={m._id} value={m._id}>{m.nombre} ({m.anio}° {m.division})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Profesor(es) *</label>
                  <select name="profesores" multiple value={form.profesores} onChange={handleMultiSelectChange} required className="w-full p-3 border rounded-xl text-sm h-24">
                    {profesoresList.map((p) => (
                      <option key={p._id} value={p._id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Usa Ctrl para seleccionar varios</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Día</label>
                     <select name="diaSemana" value={form.diaSemana} onChange={handleInputChange} className="w-full p-3 border rounded-xl text-sm">
                        {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                   </div>
                   <div />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Inicio</label><input type="time" name="horaInicio" value={form.horaInicio} onChange={handleInputChange} required className="w-full p-3 border rounded-xl text-sm" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Fin</label><input type="time" name="horaFin" value={form.horaFin} onChange={handleInputChange} required className="w-full p-3 border rounded-xl text-sm" /></div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-gray-200 rounded-xl font-bold text-gray-700 text-sm">Cancelar</button>
                  <button type="submit" disabled={loadingAction} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2">
                    {loadingAction ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {editingId ? "Guardar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
       )}
     </div>
  </div>
  );
};

export default ClasesAdmin;