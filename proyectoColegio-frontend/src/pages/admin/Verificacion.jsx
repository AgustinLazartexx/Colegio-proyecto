import { useEffect, useState } from "react";
import axios from "axios";
// Asumimos que la ruta a AuthContext es correcta para tu proyecto
import { useAuth } from "../../context/AuthContext"; 
import {
  Edit3, Trash2, X, Loader2, AlertCircle, Save, GraduationCap, Plus, Users, Clock, Calendar, BookOpen, Filter
} from "lucide-react";
// Asumimos que sweetalert2 está instalado
import Swal from "sweetalert2"; 

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
  const { token } = useAuth();
  const [clases, setClases] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID para editar, null para crear

  // El formulario solo necesita materia, profesores y horario
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

  const API_URL = "http://localhost:5000/api/clases";
  const AUX_DATA_URLS = {
    materias: "http://localhost:5000/api/materias",
    usuarios: "http://localhost:5000/api/usuarios"
  };

  useEffect(() => {
    fetchClases();
    fetchAuxiliaryData();
  }, [filter, token]);

  const fetchClases = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter,
      });
      // El backend envía 'clases' con 'id' (no '_id')
      setClases(res.data.clases || []); 
    } catch (err) {
      console.error("Error al cargar las clases:", err);
      Swal.fire("Error", "No se pudieron cargar las clases.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [resMaterias, resUsuarios] = await Promise.all([
        axios.get(AUX_DATA_URLS.materias, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(AUX_DATA_URLS.usuarios, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setMaterias(resMaterias.data || []);
      const soloProfesores = (resUsuarios.data || []).filter(u => u.rol === "profesor");
      setProfesoresList(soloProfesores);
    } catch (err) {
      console.error("Error al cargar datos auxiliares:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'materia') {
        const selectedMateria = materias.find(m => m._id === value);
        
        setForm(prev => ({
            ...prev,
            materia: value,
            anio: selectedMateria?.anio || "", 
            division: selectedMateria?.division || "",
        }));
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

  // --- CORRECCIÓN 1: Usar clase.id (porque el backend lo renombra) ---
  const abrirModalEditar = (clase) => {
    const materiaId = clase.materia?._id || clase.materia || "";
    const selectedMateria = materias.find(m => m._id === materiaId);

    setEditingId(clase.id); // <-- Usar .id, no ._id

    setForm({
      materia: materiaId,
      profesores: (clase.profesores || []).map(p => p._id || p),
      anio: selectedMateria?.anio || clase.anio || "", 
      division: selectedMateria?.division || clase.division || "",
      diaSemana: clase.diaSemana || "Lunes",
      horaInicio: clase.horario ? clase.horario.split(' - ')[0] : (clase.horaInicio || ""),
      horaFin: clase.horario ? clase.horario.split(' - ')[1] : (clase.horaFin || "")
    });
    setShowModal(true);
  };

  const abrirModalCrear = () => {
    resetForm();
    setShowModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    const selectedMateria = materias.find(m => m._id === form.materia);
    
    if (!selectedMateria) {
        Swal.fire({ title: "Error", text: "Debe seleccionar una materia válida.", icon: "error", confirmButtonColor: "#EF4444" });
        return;
    }
    
    const payload = {
        materia: form.materia,
        profesores: form.profesores,
        anio: selectedMateria.anio, 
        division: selectedMateria.division, 
        diaSemana: form.diaSemana,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
    };

    if (payload.profesores.length === 0) {
      Swal.fire({ title: "Error", text: "Debe seleccionar al menos un profesor.", icon: "error", confirmButtonColor: "#EF4444" });
      return;
    }

    setLoadingAction(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await Swal.fire({
          title: "¡Actualizado!",
          text: "La clase ha sido modificada correctamente.",
          icon: "success",
          confirmButtonColor: "#4F46E5",
        });
      } else {
        await axios.post(API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await Swal.fire({
          title: "¡Creado!",
          text: "La nueva clase ha sido registrada exitosamente.",
          icon: "success",
          confirmButtonColor: "#4F46E5",
        });
      }
      resetForm();
      fetchClases();
    } catch (err) {
      const msg = err.response?.data?.msg || "Hubo un error al guardar la clase.";
      console.error("Error al guardar clase:", err.response?.data);
      Swal.fire({
        title: "Error",
        text: msg,
        icon: "error",
        confirmButtonColor: "#EF4444",
      });
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
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await Swal.fire({
        title: "¡Eliminado!",
        text: "La clase ha sido eliminada correctamente.",
        icon: "success",
        confirmButtonColor: "#4F46E5",
      });
      fetchClases();
  	 } catch (err) {
  	   const msg = err.response?.data?.msg || "No se pudo eliminar la clase.";
  	   Swal.fire({
  	   	 title: "Error",
  	   	 text: msg,
  	   	 icon: "error",
  	   	 confirmButtonColor: "#EF4444",
  	   });
  	 }
  };

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const aniosAcademicos = [1, 2, 3, 4, 5, 6];
  const divisionesEjemplo = ["A", "B", "C"];

  const hasActiveFilters = filter.anio || filter.division || filter.diaSemana;

  return (
  	 <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
  	 	 <div className="max-w-7xl mx-auto space-y-6">
  	 	 	 
  	 	 	 {/* Header Premium */}
  	 	 	 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
  	 	 	 	 <div className="flex items-center gap-4">
  	 	 	 	 	 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl">
  	 	 	 	 	 	 <GraduationCap size={32} />
  	 	 	 	 	 </div>
  	 	 	 	 	 <div>
  	 	 	 	 	 	 <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
  	 	 	 	 	 	 	 Gestión de Clases
  	 	 	 	 	 	 </h1>
  	 	 	 	 	 	 <p className="text-lg text-gray-600 mt-1">
  	 	 	 	 	 	 	 Administra horarios, profesores y asignaciones
  	 	 	 	 	 	 </p>
  	 	 	 	 	 </div>
  	 	 	 	 </div>
  	 	 	 	 
  	 	 	 	 <button
  	 	 	 	 	 onClick={abrirModalCrear}
  	 	 	 	 	 className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
  	 	 	 	 >
  	 	 	 	 	 <Plus size={20} />
  	 	 	 	 	 Nueva Clase
  	 	 	 	 </button>
  	 	 	 </div>

  	 	 	 {/* Sección de Filtros Mejorada */}
  	 	 	 <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
  	 	 	 	 <button
  	 	 	 	 	 onClick={() => setShowFilters(!showFilters)}
  	 	 	 	 	 className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
  	 	 	 	 >
  	 	 	 	 	 <div className="flex items-center gap-3">
  	 	 	 	 	 	 <Filter size={20} className="text-indigo-600" />
  	 	 	 	 	 	 <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
  	 	 	 	 	 	 {hasActiveFilters && (
  	 	 	 	 	 	 	 <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
  	 	 	 	 	 	 	 	 Activos
  	 	 	 	 	 	 	 </span>
  	 	 	 	 	 	 )}
  	 	 	 	 	 </div>
  	 	 	 	 	 <X size={20} className={`text-gray-400 transform transition-transform ${showFilters ? 'rotate-45' : ''}`} />
  	 	 	 	 </button>
  	 	 	 	 
  	 	 	 	 {showFilters && (
  	 	 	 	 	 <div className="p-5 border-t border-gray-100 bg-gray-50">
  	 	 	 	 	 	 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 <label className="block text-sm font-semibold text-gray-700 mb-2">Año Académico</label>
  	 	 	 	 	 	 	 	 <select
  	 	 	 	 	 	 	 	 	 name="anio"
  	 	 	 	 	 	 	 	 	 value={filter.anio}
  	 	 	 	 	 	 	 	 	 onChange={handleFilterChange}
  	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
  	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 <option value="">Todos los años</option>
  	 	 	 	 	 	 	 	 	 {aniosAcademicos.map((a) => (
  	 	 	 	 	 	 	 	 	 	 <option key={a} value={a}>{a}° Año</option>
  	 	 	 	 	 	 	 	 	 ))}
  	 	 	 	 	 	 	 	 </select>
  	 	 	 	 	 	 	 </div>

  	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 <label className="block text-sm font-semibold text-gray-700 mb-2">División</label>
  	 	 	 	 	 	 	 	 <select
  	 	 	 	 	 	 	 	 	 name="division"
  	 	 	 	 	 	 	 	 	 value={filter.division}
  	 	 	 	 	 	 	 	 	 onChange={handleFilterChange}
  	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
  	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 <option value="">Todas las divisiones</option>
  	 	 	 	 	 	 	 	 	 {divisionesEjemplo.map((d) => (
  	 	 	 	 	 	 	 	 	 	 <option key={d} value={d}>{d}</option>
  	 	 	 	 	 	 	 	 	 ))}
  	 	 	 	 	 	 	 	 </select>
  	 	 	 	 	 	 	 </div>

  	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 <label className="block text-sm font-semibold text-gray-700 mb-2">Día de la Semana</label>
  	 	 	 	 	 	 	 	 <select
  	 	 	 	 	 	 	 	 	 name="diaSemana"
  	 	 	 	 	 	 	 	 	 value={filter.diaSemana}
  	 	 	 	 	 	 	 	 	 onChange={handleFilterChange}
  	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
  	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 <option value="">Todos los días</option>
  	 	 	 	 	 	 	 	 	 {diasSemana.map((d) => (
  	 	 	 	 	 	 	 	 	 	 <option key={d} value={d}>{d}</option>
  	 	 	 	 	 	 	 	 	 ))}
  	 	 	 	 	 	 	 	 </select>
  	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 </div>

  	 	 	 	 	 	 {hasActiveFilters && (
  	 	 	 	 	 	 	 <button
  	 	 	 	 	 	 	 	 onClick={() => setFilter({ anio: "", diaSemana: "", division: "" })}
  	 	 	 	 	 	 	 	 className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2"
  	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 <X size={16} />
  	 	 	 	 	 	 	 	 Limpiar todos los filtros
  	 	 	 	 	 	 	 </button>
  	 	 	 	 	 	 )}
  	 	 	 	 	 </div>
  	 	 	 	 )}
  	 	 	 </div>

  	 	 	 {/* Tabla Premium */}
  	 	 	 <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
  	 	 	 	 {loading ? (
  	 	 	 	 	 <div className="flex flex-col items-center justify-center p-16">
  	 	 	 	 	 	 <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
  	 	 	 	 	 	 <p className="text-lg text-gray-700 font-semibold">Cargando clases...</p>
  	 	 	 	 	 </div>
  	 	 	 	 ) : clases.length === 0 ? (
  	 	 	 	 	 <div className="text-center p-16">
  	 	 	 	 	 	 <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
  	 	 	 	 	 	 	 <AlertCircle size={40} className="text-gray-400" />
  	 	 	 	 	 	 </div>
  	 	 	 	 	 	 <p className="text-xl font-bold text-gray-900 mb-2">
  	 	 	 	 	 	 	 No hay clases registradas
  	 	 	 	 	 	 </p>
  	 	 	 	 	 	 <p className="text-gray-600 mb-6">
  	 	 	 	 	 	 	 {hasActiveFilters ? 'con los filtros aplicados.' : 'Comienza creando tu primera clase.'}
  	 	 	 	 	 	 </p>
  	 	 	 	 	 	 <button
  	 	 	 	 	 	 	 onClick={abrirModalCrear}
  	 	 	 	 	 	 	 className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-indigo-700 shadow-lg transition-all"
  	 	 	 	 	 	 >
  	 	 	 	 	 	 	 <Plus size={18} />
  	 	 	 	 	 	 	 Crear Primera Clase
  	 	 	 	 	 	 </button>
  	 	 	 	 	 </div>
  	 	 	 	 ) : (
  	 	 	 	 	 <div className="overflow-x-auto">
  	 	 	 	 	 	 <table className="min-w-full divide-y divide-gray-200">
  	 	 	 	 	 	 	 <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
  	 	 	 	 	 	 	 	 <tr>
  	 	 	 	 	 	 	 	 	 <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
  	 	 	 	 	 	 	 	 	 	 <div className="flex items-center gap-2">
  	 	 	 	 	 	 	 	 	 	 	 <BookOpen size={16} className="text-indigo-600" />
  	 	 	 	 	 	 	 	 	 	 	 Materia
  	 	 	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 	 </th>
  	 	 	 	 	 	 	 	 	 <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
  	 	 	 	 	 	 	 	 	 	 <div className="flex items-center gap-2">
  	 	 	 	 	 	 	 	 	 	 	 <Users size={16} className="text-indigo-600" />
  	 	 	 	 	 	 	 	 	 	 	 Profesor(es)
  	 	 	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 	 </th>
  	 	 	 	 	 	 	 	 	 <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
  	 	 	 	 	 	 	 	 	 	 <div className="flex items-center justify-center gap-2">
  	 	 	 	 	 	 	 	 	 	 	 <GraduationCap size={16} className="text-indigo-600" />
  	 	 	 	 	 	 	 	 	 	 	 Curso
  	 	 	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 	 </th>
  	 	 	 	 	 	 	 	 	 <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
  	 	 	 	 	 	 	 	 	 	 <div className="flex items-center gap-2">
  	 	 	 	 	 	 	 	 	 	 	 <Calendar size={16} className="text-indigo-600" />
  	 	 	 	 	 	 	 	 	 	 	 Día
  	 	 	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 	 </th>
  	 	 	 	 	 	 	 	 	 <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
  	 	 	 	 	 	 	 	 	 	 <div className="flex items-center gap-2">
  	 	 	 	 	 	 	 	 	 	 	 <Clock size={16} className="text-indigo-600" />
  	 	 	 	 	 	 	 	 	 	 	 Horario
  	 	 	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 	 </th>
  	 	 	 	 	 	 	 	 	 <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
  	 	 	 	 	 	 	 	 	 	 Acciones
  	 	 	 	 	 	 	 	 	 </th>
  	 	 	 	 	 	 	 	 </tr>
  	 	 	 	 	 	 	 </thead>
  	 	 	 	 	 	 	 <tbody className="bg-white divide-y divide-gray-100">
  	 	 	 	 	 	 	 	 {clases.map((c) => (
  	 	 	 	 	 	 	 	 	 // --- CORRECCIÓN 2: Usar c.id (porque el backend lo renombra) ---
  	 	 	 	 	 	 	 	 	 <tr key={c.id} className="hover:bg-indigo-50 transition-colors">
  	 	 	 	 	 	 	 	 	 	 <td className="px-6 py-4 whitespace-nowrap">
  	 	 	 	 	 	 	 	 	 	 	 <div className="text-sm font-bold text-gray-900">{c.materia?.nombre || "N/A"}</div>
  	 	 	 	 	 	 	 	 	 	 </td>
  	 	 	 	 	 	 	 	 	 	 <td className="px-6 py-4">
  	 	 	 	 	 	 	 	 	 	 	 <div className="text-sm text-gray-700">
  	 	 	 	 	 	 	 	 	 	 	 	 {(c.profesores || []).map(p => `${p.nombre} ${p.apellido || ''}`).join(', ') || "N/A"}
  	 	 	 	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 	 	 </td>
  	 	 	 	 	 	 	 	 	 	 <td className="px-6 py-4 whitespace-nowrap text-center">
  	 	 	 	 	 	 	 	 	 	 	 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
  	 	 	 	 	 	 	 	 	 	 	 	 {c.anio ? `${c.anio}° ${c.division || ''}` : "N/A"}
  	 	 	 	 	 	 	 	 	 	 	 </span>
  	 	 	 	 	 	 	 	 	 	 </td>
  	 	 	 	 	 	 	 	 	 	 <td className="px-6 py-4 whitespace-nowrap">
  	 	 	 	 	 	 	 	 	 	 	 <div className="text-sm text-gray-700">{c.diaSemana || "N/A"}</div>
  	 	 	 	 	 	 	 	 	 	 </td>
  	 	 	 	 	 	 	 	 	 	 <td className="px-6 py-4 whitespace-nowrap">
  	 	 	 	 	 	 	 	 	 	 	 <div className="text-sm font-medium text-gray-900">
  	 	 	 	 	 	 	 	 	 	 	 	 {c.horario || `${c.horaInicio || '?'} - ${c.horaFin || '?'}`}
  	 	 	 	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 	 	 </td>
  	 	 	 	 	 	 	 	 	 	 <td className="px-6 py-4 whitespace-nowrap text-center">
  	 	 	 	 	 	 	 	 	 	 	 <div className="flex items-center justify-center gap-3">
  	 	 	 	 	 	 	 	 	 	 	 	 <button
  	 	 	 	 	 	 	 	 	 	 	 	 	 onClick={() => abrirModalEditar(c)}
  	 	 	 	 	 	 	 	 	 	 	 	 	 className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
  	 	 	 	 	 	 	 	 	 	 	 	 	 title="Editar"
  	 	 	 	 	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 	 	 	 	 <Edit3 size={18} />
  	 	 	 	 	 	 	 	 	 	 	 	 </button>
  	 	 	 	 	 	 	 	 	 	 	 	 <button
  	 	 	 	 	 	 	 	 	 	 	 	 	 // --- CORRECCIÓN 3: Usar c.id (porque el backend lo renombra) ---
  	 	 	 	 	 	 	 	 	 	 	 	 	 onClick={() => handleEliminar(c.id)}
  	 	 	 	 	 	 	 	 	 	 	 	 	 className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
  	 	 	 	 	 	 	 	 	 	 	 	 	 title="Eliminar"
  	 	 	 	 	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 	 	 	 	 <Trash2 size={18} />
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

  	 	 	 {/* MODAL PREMIUM */}
  	 	 	 {showModal && (
  	 	 	 	 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
  	 	 	 	 	 <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-xl my-8 shadow-2xl relative animate-scale-in">
  	 	 	 	 	 	 <button
  	 	 	 	 	 	 	 onClick={resetForm}
  	 	 	 	 	 	 	 className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
  	 	 	 	 	 	 >
  	 	 	 	 	 	 	 <X size={24} />
  	 	 	 	 	 	 </button>
  	 	 	 	 	 	 
  	 	 	 	 	 	 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
  	 	 	 	 	 	 	 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
  	 	 	 	 	 	 	 	 <GraduationCap size={20} />
  	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 <h3 className="text-xl font-bold text-gray-900">
  	 	 	 	 	 	 	 	 	 {editingId ? "Editar Clase" : "Crear Nueva Clase"}
  	 	 	 	 	 	 	 	 </h3>
  	 	 	 	 	 	 	 	 <p className="text-xs text-gray-600 mt-0.5">
  	 	 	 	 	 	 	 	 	 {editingId ? "Modifica los datos de la clase" : "Completa la información para crear una clase"}
  	 	 	 	 	 	 	 	 </p>
  	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 </div>

  	 	 	 	 	 	 <form onSubmit={handleGuardar} className="space-y-4">
  	 	 	 	 	 	 	 {/* Materia */}
  	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 <label className="block text-xs font-bold text-gray-700 mb-1.5">
  	 	 	 	 	 	 	 	 	 Materia *
  	 	 	 	 	 	 	 	 </label>
  	 	 	 	 	 	 	 	 <select
  	 	 	 	 	 	 	 	 	 name="materia"
  	 	 	 	 	 	 	 	 	 value={form.materia}
  	 	 	 	 	 	 	 	 	 onChange={handleInputChange}
  	 	 	 	 	 	 	 	 	 required
  	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
  	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 <option value="">Seleccionar Materia</option>
  	 	 	 	 	 	 	 	 	 {materias.map((m) => (
  	 	 	 	 	 	 	 	 	 	 <option key={m._id} value={m._id}>
  	 	 	 	 	 	 	 	 	 	 	 {m.nombre} ({m.anio}° Año - Div. {m.division})
  	 	 	 	 	 	 	 	 	 	 </option>
  	 	 	 	 	 	 	 	 	 ))}
  	 	 	 	 	 	 	 	 </select>
  	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 
  	 	 	 	 	 	 	 {/* Visualización de Curso Automático (Solo informativo) */}
  	 	 	 	 	 	 	 {form.materia && materias.find(m => m._id === form.materia) && (
  	 	 	 	 	 	 	 	 <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800 font-medium">
  	 	 	 	 	 	 	 	 	 <p>Curso: **{materias.find(m => m._id === form.materia).anio}° {materias.find(m => m._id === form.materia).division}**</p>
  	 	 	 	 	 	 	 	 	 <p className="text-xs text-indigo-600 mt-1">El Año y División se toman automáticamente de la materia.</p>
  	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 )}

  	 	 	 	 	 	 	 {/* Profesores */}
  	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 <label className="block text-xs font-bold text-gray-700 mb-1.5">
  	 	 	 	 	 	 	 	 	 Profesor(es) *
  	 	 	 	 	 	 	 	 </label>
  	 	 	 	 	 	 	 	 <select
  	 	 	 	 	 	 	 	 	 name="profesores"
  	 	 	 	 	 	 	 	 	 multiple
  	 	 	 	 	 	 	 	 	 value={form.profesores}
  	 	 	 	 	 	 	 	 	 onChange={handleMultiSelectChange}
  	 	 	 	 	 	 	 	 	 required
  	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white h-24"
  	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 {profesoresList.map((p) => (
  	 	 	 	 	 	 	 	 	 	 <option key={p._id} value={p._id}>
  	 	 	 	 	 	 	 	 	 	 	 {p.nombre} {p.apellido || ''}
  	 	 	 	 	 	 	 	 	 	 </option>
  	 	 	 	 	 	 	 	 	 ))}
  	 	 	 	 	 	 	 	 </select>
  	 	 	 	 	 	 	 	 <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
  	 	 	 	 	 	 	 	 	 <AlertCircle size={10} />
  	 	 	 	 	 	 	 	 	 Mantén Ctrl/Cmd para seleccionar varios
  	 	 	 	 	 	 	 	 </p>
  	 	 	 	 	 	 	 </div>

  	 	 	 	 	 	 	 {/* Día y Horarios */}
  	 	 	 	 	 	 	 <div className="grid grid-cols-2 gap-3">
  	 	 	 	 	 	 	 	 {/* Día de la Semana */}
  	 	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 	 <label className="block text-xs font-bold text-gray-700 mb-1.5">
  	 	 	 	 	 	 	 	 	 	 Día de la Semana *
  	 	 	 	 	 	 	 	 	 </label>
  	 	 	 	 	 	 	 	 	 <select
  	 	 	 	 	 	 	 	 	 	 name="diaSemana"
  	 	 	 	 	 	 	 	 	 	 value={form.diaSemana}
  	 	 	 	 	 	 	 	 	 	 onChange={handleInputChange}
  	 	 	 	 	 	 	 	 	 	 required
  	 	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
  	 	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 	 {diasSemana.map((dia) => (
  	 	 	 	 	 	 	 	 	 	 	 <option key={dia} value={dia}>{dia}</option>
  	 	 	 	 	 	 	 	 	 	 ))}
  	 	 	 	 	 	 	 	 	 </select>
  	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 	 <div />
  	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 
  	 	 	 	 	 	 	 <div className="grid grid-cols-2 gap-3">
  	 	 	 	 	 	 	 	 {/* Hora Inicio */}
  	 	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 	 <label className="block text-xs font-bold text-gray-700 mb-1.5">
  	 	 	 	 	 	 	 	 	 	 Hora Inicio *
  	 	 	 	 	 	 	 	 	 </label>
  	 	 	 	 	 	 	 	 	 <input
  	 	 	 	 	 	 	 	 	 	 type="time"
  	 	 	 	 	 	 	 	 	 	 name="horaInicio"
  	 	 	 	 	 	 	 	 	 	 value={form.horaInicio}
  	 	 	 	 	 	 	 	 	 	 onChange={handleInputChange}
  	 	 	 	 	 	 	 	 	 	 required
  	 	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
  	 	 	 	 	 	 	 	 	 />
  	 	 	 	 	 	 	 	 </div>

  	 	 	 	 	 	 	 	 {/* Hora Fin */}
  	 	 	 	 	 	 	 	 <div>
  	 	 	 	 	 	 	 	 	 <label className="block text-xs font-bold text-gray-700 mb-1.5">
  	 	 	 	 	 	 	 	 	 	 Hora Fin *
  	 	 	 	 	 	 	 	 	 </label>
  	 	 	 	 	 	 	 	 	 <input
  	 	 	 	 	 	 	 	 	 	 type="time"
  	 	 	 	 	 	 	 	 	 	 name="horaFin"
  	 	 	 	 	 	 	 	 	 	 value={form.horaFin}
  	 	 	 	 	 	 	 	 	 	 onChange={handleInputChange}
  	 	 	 	 	 	 	 	 	 	 required
  	 	 	 	 	 	 	 	 	 	 className="w-full border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
  	 	 	 	 	 	 	 	 	 />
  	 	 	 	 	 	 	 	 </div>
  	 	 	 	 	 	 	 </div>

  	 	 	 	 	 	 	 {/* Botones */}
  	 	 	 	 	 	 	 <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
  	 	 	 	 	 	 	 	 <button
  	 	 	 	 	 	 	 	 	 type="button"
  	 	 	 	 	 	 	 	 	 onClick={resetForm}
  	 	 	 	 	 	 	 	 	 className="bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
  	 	 	 	 	 	 	 	 	 disabled={loadingAction}
  	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 Cancelar
  	 	 	 	 	 	 	 	 </button>
  	 	 	 	 	 	 	 	 <button
  	 	 	 	 	 	 	 	 	 type="submit"
  	 	 	 	 	 	 	 	 	 className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg text-sm"
  	 	 	 	 	 	 	 	 	 disabled={loadingAction}
  	 	 	 	 	 	 	 	 >
  	 	 	 	 	 	 	 	 	 {loadingAction ? (
  	 	 	 	 	 	 	 	 	 	 <>
  	 	 	 	 	 	 	 	 	 	 	 <Loader2 size={16} className="animate-spin" />
  	 	 	 	 	 	 	 	 	 	 	 Guardando...
  	 	 	 	 	 	 	 	 	 	 </>
  	 	 	 	 	 	 	 	 	 ) : (
  	 	 	 	 	 	 	 	 	 	 <>
  	 	   	 	 	 	 	 	 	 	 <Save size={16} />
                                          {/* CORRECCIÓN 4: Usar editingId para cambiar el texto del botón */}
  	 	   	 	 	 	 	 	 	 	 {editingId ? "Guardar Cambios" : "Crear"} 
  	 	   	 	 	 	 	 	 	 </>
          	   	 	 	 	 	 )}
    	     	 	 	 	 	 </button>
      	   	 	 	 	 </div>
        	 	 	 	 </form>
      	 	 	 	 </div>
      	 	 	 </div>
      	 	 )}
    	 </div>

    	 <style jsx global>{`
      	 @keyframes scale-in {
      	 	 0% {
  	 	   	 	 opacity: 0;
  	 	   	 	 transform: scale(0.95);
  	 	   	 }
  	 	   	 100% {
  	 	 	 	 	 opacity: 1;
  	 	 	 	 	 transform: scale(1);
  	 	 	 	 }
  	 	   }
  	 	   .animate-scale-in {
  	 	 	 	 animation: scale-in 0.2s ease-out forwards;
  	 	   }
    	 `}</style>
    </div>
  );
};

export default ClasesAdmin;