import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Filter, GraduationCap, Loader2, Search } from 'lucide-react';
import CargarNotas from '../profesor/CargarNotas';

// 1. IMPORTAR DESDE API.JS
import { getMaterias } from '../../api/api'; 

const AdminGestionNotas = () => {
  const { token } = useAuth(); // El token lo maneja api.js, pero usamos esto para saber si está cargado
  const [allMaterias, setAllMaterias] = useState([]);
  const [filteredMaterias, setFilteredMaterias] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState('');
  const [selectedMateriaId, setSelectedMateriaId] = useState('');
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  const aniosDisponibles = ["1", "2", "3", "4", "5", "6"];

  // 2. Cargar Materias
  useEffect(() => {
    const fetchAllMaterias = async () => {
      if (!token) return; // Esperar a que haya sesión
      
      setLoadingMaterias(true);
      try {
        // Usamos la función centralizada
        const res = await getMaterias();
        
        // Manejo robusto de la respuesta (puede venir directa o en propiedad)
        const data = res.data.materias || res.data || [];
        
        setAllMaterias(data);
        setFilteredMaterias(data);
      } catch (err) {
        console.error("Error cargando materias:", err);
        toast.error("Error al cargar materias.");
      } finally {
        setLoadingMaterias(false);
      }
    };

    fetchAllMaterias();
  }, [token]);

  // 3. Filtrar Materias
  useEffect(() => {
    if (!selectedAnio) {
      setFilteredMaterias(allMaterias);
    } else {
      setFilteredMaterias(allMaterias.filter(m => String(m.anio) === selectedAnio));
    }
    setSelectedMateriaId('');
  }, [selectedAnio, allMaterias]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
          <div className="bg-sky-100 p-3 rounded-full"><GraduationCap className="text-sky-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Gestión de Notas (Admin)</h1>
            <p className="text-gray-500">Supervisar y modificar calificaciones.</p>
          </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Filter size={18} /> Filtros</h2>
          {loadingMaterias ? <Loader2 className="animate-spin mx-auto" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium mb-1">Año</label>
                      <select value={selectedAnio} onChange={(e) => setSelectedAnio(e.target.value)} className="w-full p-2 border rounded">
                          <option value="">Todos</option>
                          {aniosDisponibles.map(a => <option key={a} value={a}>{a}° Año</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">Materia</label>
                      <select 
                        value={selectedMateriaId} 
                        onChange={(e) => setSelectedMateriaId(e.target.value)} 
                        className="w-full p-2 border rounded"
                        disabled={(!selectedAnio && allMaterias.length > 50) || loadingMaterias}
                      >
                          <option value="">Seleccionar...</option>
                          {filteredMaterias.map(m => (
                              <option key={m._id} value={m._id}>{m.nombre} ({m.anio}° "{m.division || 'U'}")</option>
                          ))}
                      </select>
                  </div>
              </div>
          )}
      </div>

      {/* Renderizado Condicional de CargarNotas */}
      {selectedMateriaId ? (
          <div className="bg-white rounded shadow overflow-hidden">
              <CargarNotas materiaIdProp={selectedMateriaId} />
          </div>
      ) : (
          <div className="text-center py-12 bg-white rounded shadow border-dashed border">
                <Search className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-500">Selecciona una materia para ver las notas.</p>
          </div>
      )}
    </div>
  );
};

export default AdminGestionNotas;