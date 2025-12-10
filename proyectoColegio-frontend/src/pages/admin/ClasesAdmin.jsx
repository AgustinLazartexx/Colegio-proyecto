import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; 
import {
  Edit3, Trash2, X, Loader2, AlertCircle, Save, GraduationCap, Plus, Filter, Clock, MapPin, Users, Hash, Calendar
} from "lucide-react";
import Swal from "sweetalert2"; 

// IMPORTAMOS DESDE API.JS
import { 
  getTodasLasClases, 
  getMaterias, 
  getProfesores, 
  crearClase, 
  actualizarClase, 
  eliminarClase 
} from "../../api/api";

// Helper para obtener valores de select múltiple
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
  const { token } = useAuth();
  const [clases, setClases] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- FORMULARIO MEJORADO (Incluye Aula) ---
  const [form, setForm] = useState({
    materia: "",
    profesores: [],
    diaSemana: "Lunes",
    horaInicio: "",
    horaFin: "",
    aula: "" // Nuevo campo agregado
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
      const res = await getTodasLasClases(); 
      // Aseguramos que sea un array
      const data = Array.isArray(res.data) ? res.data : (res.data.clases || []);
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
      setProfesoresList(listaProfes.filter(u => u.rol === 'profesor')); 
    } catch (err) {
      console.error("Error al cargar datos auxiliares:", err);
    }
  };

  // --- MANEJO DEL FORMULARIO ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Si cambia la materia, podríamos autocompletar algo, pero por ahora solo guardamos ID
    setForm(prev => ({ ...prev, [name]: value }));
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
      horaFin: "",
      aula: ""
    });
    setEditingId(null);
    setShowModal(false);
  };

  const abrirModalEditar = (clase) => {
    setEditingId(clase._id || clase.id);
    setForm({
      materia: clase.materia?._id || clase.materia || "",
      profesores: (clase.profesores || []).map(p => p._id || p),
      diaSemana: clase.diaSemana || "Lunes",
      horaInicio: clase.horaInicio || "",
      horaFin: clase.horaFin || "",
      aula: clase.aula || "" // Cargar aula existente
    });
    setShowModal(true);
  };

  const abrirModalCrear = () => {
    resetForm();
    setShowModal(true);
  };

  // --- GUARDAR ---
  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!form.materia || form.profesores.length === 0 || !form.horaInicio || !form.horaFin) {
        Swal.fire("Atención", "Por favor completa los campos obligatorios.", "warning");
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
        aula: form.aula // Enviamos el aula
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

    if (confirm.isConfirmed) {
        try {
          await eliminarClase(id);
          Swal.fire("¡Eliminado!", "Clase eliminada.", "success");
          fetchClases();
        } catch (err) {
          Swal.fire("Error", "No se pudo eliminar.", "error");
        }
    }
  };

  // --- FILTRADO ---
  const clasesFiltradas = clases.filter(c => {
      const matchAnio = !filter.anio || String(c.anio) === String(filter.anio);
      const matchDiv = !filter.division || (c.division && c.division.toUpperCase() === filter.division.toUpperCase());
      const matchDia = !filter.diaSemana || c.diaSemana === filter.diaSemana;
      return matchAnio && matchDiv && matchDia;
  });

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const aniosAcademicos = [1, 2, 3, 4, 5, 6];
  const divisionesEjemplo = ["A", "B", "C", "D"];
  const hasActiveFilters = filter.anio || filter.division || filter.diaSemana;

  return (
     <div className="min-h-screen bg-gray-50 p-6">
       <div className="max-w-7xl mx-auto space-y-6">
         
         {/* HEADER */}
         <div className="flex flex-col md:flex-row justify-between items-end gap-4">
           <div>
             <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={32}/> Gestión de Cronograma
             </h1>
             <p className="text-gray-500 mt-1">Configura los horarios, aulas y profesores de cada materia.</p>
           </div>
           
           <button onClick={abrirModalCrear} className="bg-indigo-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:bg-indigo-700 transition flex items-center gap-2">
             <Plus size={20} /> Asignar Nueva Clase
           </button>
         </div>

         {/* BARRA DE FILTROS */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 min-w-[80px]">
                    <Filter size={18} /> <span className="text-sm font-medium">Filtrar:</span>
                </div>
                
                <select name="anio" value={filter.anio} onChange={handleFilterChange} className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-auto">
                    <option value="">Todos los Años</option>
                    {aniosAcademicos.map(a => <option key={a} value={a}>{a}° Año</option>)}
                </select>

                <select name="division" value={filter.division} onChange={handleFilterChange} className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-auto">
                    <option value="">Todas las Divisiones</option>
                    {divisionesEjemplo.map(d => <option key={d} value={d}>División {d}</option>)}
                </select>

                <select name="diaSemana" value={filter.diaSemana} onChange={handleFilterChange} className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-auto">
                    <option value="">Todos los Días</option>
                    {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {hasActiveFilters && (
                    <button onClick={() => setFilter({ anio: "", diaSemana: "", division: "" })} className="text-red-500 hover:text-red-700 text-sm font-medium ml-auto">
                        Borrar filtros
                    </button>
                )}
            </div>
         </div>

         {/* TABLA DETALLADA */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           {loading ? (
             <div className="p-12 flex justify-center"><Loader2 size={40} className="animate-spin text-indigo-600" /></div>
           ) : clasesFiltradas.length === 0 ? (
             <div className="p-12 text-center flex flex-col items-center">
               <AlertCircle size={48} className="text-gray-300 mb-4" />
               <p className="text-lg font-medium text-gray-900">No hay clases configuradas</p>
               <p className="text-gray-500 text-sm">Intenta cambiar los filtros o crea una nueva clase.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                   <tr>
                     <th className="px-6 py-4">Materia / Curso</th>
                     <th className="px-6 py-4">Horario y Lugar</th>
                     <th className="px-6 py-4">Equipo Docente</th>
                     <th className="px-6 py-4 text-center">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {clasesFiltradas.map((c) => (
                     <tr key={c._id} className="hover:bg-indigo-50/30 transition group">
                       
                       {/* COLUMNA 1: MATERIA Y CURSO */}
                       <td className="px-6 py-4">
                         <div className="flex items-start gap-3">
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mt-1">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-base">{c.materia?.nombre || "Sin nombre"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        {c.anio}° Año "{c.division}"
                                    </span>
                                </div>
                            </div>
                         </div>
                       </td>

                       {/* COLUMNA 2: HORARIO Y AULA */}
                       <td className="px-6 py-4">
                         <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <Calendar size={16} className="text-gray-400"/> {c.diaSemana}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Clock size={16} className="text-gray-400"/> 
                                {c.horaInicio} - {c.horaFin} hs
                            </div>
                            {c.aula ? (
                                <div className="flex items-center gap-2 text-indigo-600 text-sm bg-indigo-50 w-fit px-2 py-0.5 rounded">
                                    <MapPin size={14}/> Aula: {c.aula}
                                </div>
                            ) : (
                                <span className="text-gray-400 text-xs italic ml-6">Aula sin asignar</span>
                            )}
                         </div>
                       </td>

                       {/* COLUMNA 3: PROFESORES (AVATARES) */}
                       <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            {c.profesores && c.profesores.length > 0 ? (
                                c.profesores.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold border border-purple-200">
                                            {p.nombre ? p.nombre.charAt(0) : "?"}
                                        </div>
                                        <span className="text-sm text-gray-700">{p.nombre} {p.apellido}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={14}/> Sin profesores</span>
                            )}
                         </div>
                       </td>

                       {/* COLUMNA 4: ACCIONES */}
                       <td className="px-6 py-4 text-center">
                         <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => abrirModalEditar(c)} className="p-2 bg-white border border-gray-200 text-indigo-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 shadow-sm transition" title="Editar Clase">
                             <Edit3 size={16}/>
                           </button>
                           <button onClick={() => handleEliminar(c._id)} className="p-2 bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 shadow-sm transition" title="Eliminar Clase">
                             <Trash2 size={16}/>
                           </button>
                         </div>
                       </td>

                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
      
       {/* MODAL CREAR / EDITAR */}
       {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-900">{editingId ? "Editar Clase" : "Nueva Clase"}</h3>
                  <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleGuardar} className="space-y-5">
                
                {/* Selección de Materia */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Materia <span className="text-red-500">*</span></label>
                  <select name="materia" value={form.materia} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">-- Seleccionar Materia --</option>
                    {materias.map((m) => (
                      <option key={m._id} value={m._id}>{m.nombre} ({m.anio}° {m.division})</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Selecciona la materia para vincular año y división automáticamente.</p>
                </div>

                {/* Selección de Profesores */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Profesores a cargo <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <select name="profesores" multiple value={form.profesores} onChange={handleMultiSelectChange} required className="w-full p-3 border border-gray-300 rounded-lg text-sm h-32 focus:ring-2 focus:ring-indigo-500 outline-none">
                        {profesoresList.map((p) => (
                          <option key={p._id} value={p._id}>{p.nombre} {p.apellido} ({p.email})</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                          <Users size={16}/>
                      </div>
                  </div>
                  <p className="text-xs text-indigo-600 mt-1 font-medium">💡 Tip: Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar varios profesores.</p>
                </div>

                {/* Horarios y Aula */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Día de la semana</label>
                      <select name="diaSemana" value={form.diaSemana} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm">
                         {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Aula Física</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400"/>
                            <input type="text" name="aula" value={form.aula} onChange={handleInputChange} placeholder="Ej: Aula 101, Lab 2" className="w-full pl-9 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Hora Inicio</label>
                      <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Hora Fin</label>
                      <input type="time" name="horaFin" value={form.horaFin} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 text-sm transition">Cancelar</button>
                  <button type="submit" disabled={loadingAction} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition disabled:opacity-50">
                    {loadingAction ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {editingId ? "Guardar Cambios" : "Crear Clase"}
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