import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Filter, GraduationCap, Loader2, Search, BookOpen, Users } from 'lucide-react';
import CargarNotas from '../profesor/CargarNotas';
import { getMaterias } from '../../api/api';

const AdminGestionNotas = () => {
  const { token } = useAuth();
  const [allMaterias, setAllMaterias] = useState([]);
  const [filteredMaterias, setFilteredMaterias] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState('');
  const [selectedMateriaId, setSelectedMateriaId] = useState('');
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  const aniosDisponibles = ["1", "2", "3", "4", "5", "6"];

  useEffect(() => {
    const fetchAllMaterias = async () => {
      setLoadingMaterias(true);
      try {
        const res = await getMaterias();
        const data = Array.isArray(res.data) ? res.data : (res.data.materias || []);
        setAllMaterias(data);
        setFilteredMaterias(data);
      } catch (err) {
        console.error("Error cargando materias:", err);
        toast.error("Error al cargar el listado de materias.");
      } finally {
        setLoadingMaterias(false);
      }
    };

    fetchAllMaterias();
  }, [token]);

  useEffect(() => {
    if (!selectedAnio) {
      setFilteredMaterias(allMaterias);
    } else {
      setFilteredMaterias(allMaterias.filter(m => String(m.anio) === selectedAnio));
    }
    setSelectedMateriaId('');
  }, [selectedAnio, allMaterias]);

  const materiaActiva = allMaterias.find(m => m._id === selectedMateriaId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start gap-5">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <GraduationCap className="text-white" size={36} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestión de Notas
              </h1>
              <p className="text-gray-600 text-base">
                Supervisar y modificar las calificaciones cargadas por profesores en tiempo real
              </p>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BookOpen size={16} />
                  <span>{allMaterias.length} materias registradas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={16} />
                  <span>Panel administrativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Panel de Filtros Mejorado */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg flex items-center gap-2.5 text-gray-800">
              <div className="bg-blue-500 p-1.5 rounded-lg">
                <Filter size={18} className="text-white" />
              </div>
              Filtros de Búsqueda
            </h2>
          </div>

          <div className="p-6">
            {loadingMaterias ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600 mb-3" size={40} />
                <p className="text-gray-500 text-sm">Cargando materias...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Selector Año */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Año Académico
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAnio}
                      onChange={(e) => setSelectedAnio(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300 text-gray-700 font-medium"
                    >
                      <option value=""> Todos los años</option>
                      {aniosDisponibles.map(a => (
                        <option key={a} value={a}>{a}° Año</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {selectedAnio && (
                    <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Filtrando {filteredMaterias.length} materia(s)
                    </p>
                  )}
                </div>

                {/* Selector Materia */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Materia
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMateriaId}
                      onChange={(e) => setSelectedMateriaId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 text-gray-700 font-medium"
                      disabled={filteredMaterias.length === 0}
                    >
                      <option value=""> Seleccionar materia</option>
                      {filteredMaterias.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.nombre} ({m.anio}° "{m.division || 'U'}") - {m.profesor?.nombre || 'Sin Profesor'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {selectedMateriaId && materiaActiva && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Materia seleccionada correctamente
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Renderizado del Componente de Notas */}
        {selectedMateriaId && materiaActiva ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {materiaActiva.nombre}
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {materiaActiva.anio}° Año - División "{materiaActiva.division || 'U'}" • 
                    Profesor: {materiaActiva.profesor?.nombre || 'Sin asignar'}
                  </p>
                </div>
                <div className="bg-green-100 px-4 py-2 rounded-full">
                  <span className="text-green-700 font-semibold text-sm">Activa</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <CargarNotas
                materiaId={selectedMateriaId}
                materiaNombre={materiaActiva.nombre}
                anio={materiaActiva.anio}
                division={materiaActiva.division}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border-2 border-dashed border-gray-300 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-full mb-6">
                <Search className="w-16 h-16 text-blue-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Selecciona una materia
              </h3>
              <p className="text-gray-500 text-center max-w-md mb-1">
                Utiliza los filtros superiores para encontrar y seleccionar la materia que deseas gestionar.
              </p>
              <p className="text-sm text-gray-400">
                Podrás ver y editar las notas en tiempo real una vez seleccionada.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGestionNotas;