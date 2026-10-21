import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Plus, Search, Edit2, Ban, CircleCheck, BookOpen, X, Loader2, User, Users, Filter, Book, ListChecks, GraduationCap } from "lucide-react";
import Swal from "sweetalert2";
import { 
  getMaterias, 
  createMateria, 
  updateMateria, 
  setMateriaActive,
  getProfesores 
} from "../../api/api";

const MateriasAdmin = () => {
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnio, setFilterAnio] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
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
        getMaterias({ includeSuspended: true }),
        getProfesores()
      ]);
      setMaterias(resMaterias.data || []);
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
      const payload = { ...formData };
      if (!payload.profesor) delete payload.profesor;

      if (editingMateria) {
        await updateMateria(editingMateria._id, payload);
        toast.success("Materia actualizada exitosamente");
      } else {
        await createMateria(payload);
        toast.success("Materia creada exitosamente");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.msg || "Error al guardar";
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (materia) => {
    const isActive = !materia.isActive;
    Swal.fire({
      title: isActive ? "¿Reactivar materia?" : "¿Suspender materia?",
      text: isActive
        ? `La materia "${materia.nombre}" volverá a estar disponible.`
        : `La materia "${materia.nombre}" se conservará, pero dejará de estar disponible para las clases.`,
      icon: isActive ? "question" : "warning",
      showCancelButton: true,
      confirmButtonText: isActive ? "Sí, reactivar" : "Sí, suspender",
      cancelButtonText: "Cancelar",
      confirmButtonColor: isActive ? "#059669" : "#d97706",
      cancelButtonColor: "#6b7280"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await setMateriaActive(materia._id, isActive);
          setMaterias(prev => prev.map(m => m._id === materia._id ? response.data.materia : m));
          Swal.fire(
            isActive ? "Materia reactivada" : "Materia suspendida",
            isActive ? "La materia vuelve a estar disponible." : "La materia se conservó y quedó suspendida.",
            "success",
          );
        } catch (error) {
          toast.error(error.response?.data?.msg || "No se pudo cambiar el estado de la materia.");
        }
      }
    });
  };

  const filteredMaterias = materias.filter(m => {
    const matchSearch = m.nombre.toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchAnio = !filterAnio || String(m.anio) === filterAnio;
    const matchDivision = !filterDivision || String(m.division || "").toUpperCase() === filterDivision;
    return matchSearch && matchAnio && matchDivision;
  });
  const hasActiveFilters = Boolean(searchTerm.trim() || filterAnio || filterDivision);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando materias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <BookOpen className="text-white" size={36} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gestión de Materias
                </h1>
                <p className="text-gray-600">
                  Administra el catálogo completo de materias del establecimiento
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Book size={16} />
                    <span>{materias.length} materias registradas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={16} />
                    <span>{profesores.length} profesores disponibles</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleOpenModal()} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl active:scale-95"
            >
              <Plus size={20} strokeWidth={2.5} />
              Nueva Materia
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Panel de Búsqueda y Filtros */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg flex items-center gap-2.5 text-gray-800">
              <div className="bg-blue-500 p-1.5 rounded-lg">
                <Filter size={18} className="text-white" />
              </div>
              Búsqueda y Filtros
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Búsqueda por nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar por nombre
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Ej: Matemática, Lengua..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filtrar por división
                </label>
                <div className="relative">
                  <select
                    value={filterDivision}
                    onChange={e => setFilterDivision(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300 font-medium text-gray-700"
                  >
                    <option value="">Todas las divisiones</option>
                    {divisiones.map(d => <option key={d} value={d}>División {d}</option>)}
                  </select>
                  <ListChecks className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Filtro por año */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filtrar por año
                </label>
                <div className="relative">
                  <select 
                    value={filterAnio} 
                    onChange={e => setFilterAnio(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300 font-medium text-gray-700"
                  >
                    <option value="">Todos los años</option>
                    {anios.map(a => <option key={a} value={a}>{a}° Año</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Contador de resultados */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span className="font-medium">
                  {filteredMaterias.length} resultado{filteredMaterias.length !== 1 ? 's' : ''} encontrado{filteredMaterias.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Grid de Materias */}
        {!hasActiveFilters ? (
          <div className="bg-white rounded-2xl shadow-md border-2 border-dashed border-indigo-200 p-16 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-indigo-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Busca una materia</h3>
            <p className="text-gray-500 max-w-lg mx-auto">
              Escribe su nombre o selecciona año y división para ver las materias que necesitas.
            </p>
          </div>
        ) : filteredMaterias.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No se encontraron materias
            </h3>
            <p className="text-gray-500 mb-6">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMaterias.map(materia => (
              <div 
                key={materia._id} 
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2"
              >
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 relative">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => handleOpenModal(materia)} 
                      className="bg-white/90 hover:bg-white p-2 rounded-lg text-blue-600 hover:text-blue-700 transition-all shadow-lg active:scale-95"
                      title="Editar materia"
                    >
                      <Edit2 size={18} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(materia)}
                      className={`bg-white/90 hover:bg-white p-2 rounded-lg transition-all shadow-lg active:scale-95 ${materia.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}`}
                      title={materia.isActive ? "Suspender materia" : "Reactivar materia"}
                      aria-label={materia.isActive ? `Suspender ${materia.nombre}` : `Reactivar ${materia.nombre}`}
                    >
                      {materia.isActive ? <Ban size={18} strokeWidth={2} /> : <CircleCheck size={18} strokeWidth={2} />}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <GraduationCap className="text-white" size={24} />
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-xl text-white mb-2 pr-20">
                    {materia.nombre}
                  </h3>
                  <span className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${materia.isActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                    {materia.isActive ? "Activa" : "Suspendida"}
                  </span>
                  
                  <div className="flex gap-2">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/30">
                      {materia.anio}° Año
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/30">
                      División {materia.division}
                    </span>
                  </div>
                </div>

                {/* Cuerpo de la tarjeta */}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-2 rounded-lg">
                      <User className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Profesor Asignado
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {materia.profesor 
                          ? `${materia.profesor.nombre} ${materia.profesor.apellido || ''}` 
                          : 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <BookOpen className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-xl text-white">
                  {editingMateria ? "Editar Materia" : "Nueva Materia"}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-5">
              {/* Nombre de la materia */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Materia *
                </label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                  placeholder="Ej: Matemática, Lengua..." 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  required 
                />
              </div>

              {/* Año y División */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Año *
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer font-medium text-gray-700"
                      value={formData.anio} 
                      onChange={e => setFormData({...formData, anio: e.target.value})} 
                      required
                    >
                      <option value="">Seleccionar</option>
                      {anios.map(a => <option key={a} value={a}>{a}° Año</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    División *
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer font-medium text-gray-700"
                      value={formData.division} 
                      onChange={e => setFormData({...formData, division: e.target.value})} 
                      required
                    >
                      <option value="">Seleccionar</option>
                      {divisiones.map(d => <option key={d} value={d}>División {d}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profesor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profesor Asignado (Opcional)
                </label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer font-medium text-gray-700"
                    value={formData.profesor} 
                    onChange={e => setFormData({...formData, profesor: e.target.value})}
                  >
                    <option value="">Sin asignar</option>
                    {profesores.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.nombre} {p.apellido}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                >
                  {editingMateria ? "Actualizar" : "Crear Materia"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MateriasAdmin;