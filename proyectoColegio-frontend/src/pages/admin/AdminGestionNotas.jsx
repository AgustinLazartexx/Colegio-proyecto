import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Filter, GraduationCap, Loader2, Search, ChevronRight, School } from 'lucide-react';
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
        toast.error("No se pudo sincronizar con el servidor.");
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
    setSelectedMateriaId(''); // Reset al cambiar filtro
  }, [selectedAnio, allMaterias]);

  const materiaActiva = allMaterias.find(m => m._id === selectedMateriaId);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      {/* --- Encabezado Principal --- */}
      <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                      <GraduationCap size={32} strokeWidth={1.5} />
                  </div>
                  <div>
                      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Notas</h1>
                      <p className="text-slate-500 font-medium mt-1">Panel de Administración Académica</p>
                  </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                  <School size={14} />
                  <span>Colegio</span>
                  <ChevronRight size={14} />
                  <span>Administración</span>
                  <ChevronRight size={14} />
                  <span className="text-blue-600 font-semibold">Notas</span>
              </div>
          </div>
      </header>

      {/* --- Barra de Herramientas / Filtros --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Filter className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-700">Filtros de Selección</h3>
          </div>

          {loadingMaterias ? (
              <div className="flex justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-blue-600" size={30} />
                      <span className="text-sm text-slate-400">Cargando catálogo...</span>
                  </div>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Selector de Año */}
                  <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1">Año Escolar</label>
                      <div className="relative">
                          <select 
                            value={selectedAnio} 
                            onChange={(e) => setSelectedAnio(e.target.value)} 
                            className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
                          >
                              <option value="">Todos los años</option>
                              {aniosDisponibles.map(a => <option key={a} value={a}>{a}° Año</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronRight className="rotate-90" size={16} />
                          </div>
                      </div>
                  </div>

                  {/* Selector de Materia */}
                  <div className="md:col-span-9">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1">Materia / Curso</label>
                      <div className="relative">
                          <select 
                            value={selectedMateriaId} 
                            onChange={(e) => setSelectedMateriaId(e.target.value)} 
                            className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={filteredMaterias.length === 0}
                          >
                              <option value="">-- Seleccione una materia para comenzar --</option>
                              {filteredMaterias.map(m => (
                                  <option key={m._id} value={m._id}>
                                    {m.nombre} | {m.anio}° "{m.division || 'U'}" | Docente: {m.profesor?.nombre ? `${m.profesor.nombre} ${m.profesor.apellido}` : 'Sin Asignar'}
                                  </option>
                              ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <Search size={16} />
                          </div>
                      </div>
                      {filteredMaterias.length === 0 && (
                          <p className="text-xs text-amber-600 mt-2 ml-1 flex items-center gap-1">
                              <AlertCircle size={12}/> No se encontraron materias para el filtro seleccionado.
                          </p>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* --- Área de Contenido (Tabla) --- */}
      <div className="transition-all duration-500 ease-in-out">
          {selectedMateriaId && materiaActiva ? (
              <CargarNotas 
                  materiaId={selectedMateriaId} 
                  materiaNombre={materiaActiva.nombre}
                  anio={materiaActiva.anio}
                  division={materiaActiva.division}
              />
          ) : (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-slate-400">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Search className="w-12 h-12 text-blue-200" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600">Esperando selección</h3>
                    <p className="max-w-sm text-center mt-1 text-sm">
                        Selecciona un año y una materia en el panel superior para visualizar y editar las calificaciones de los alumnos.
                    </p>
              </div>
          )}
      </div>
    </div>
  );
};

export default AdminGestionNotas;