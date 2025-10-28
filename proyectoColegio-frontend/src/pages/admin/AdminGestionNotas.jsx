// src/pages/admin/AdminGestionNotas.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Filter, GraduationCap, History, Loader2, Search } from 'lucide-react'; //
import CargarNotas from '../profesor/CargarNotas'; // Importa el componente reutilizable
import AdminAuditoriaNotas from './AdminPanelNotas'; // Importa el componente de auditoría

const AdminGestionNotas = () => {
  const { token, usuario } = useAuth(); // Obtenemos el rol del admin
  const [allMaterias, setAllMaterias] = useState([]);
  const [filteredMaterias, setFilteredMaterias] = useState([]);
  
  // Estados para los filtros
  const [selectedAnio, setSelectedAnio] = useState('');
  const [selectedMateriaId, setSelectedMateriaId] = useState('');
  
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  // Opciones únicas para los filtros (se podrían obtener del backend)
  const aniosDisponibles = ["1", "2", "3", "4", "5", "6"]; // Ejemplo

  // Cargar TODAS las materias al inicio (para el Admin)
  useEffect(() => {
    const fetchAllMaterias = async () => {
      setLoadingMaterias(true);
      try {
        // Asume que tienes un endpoint que devuelve TODAS las materias
        const res = await axios.get("http://localhost:5000/api/materias", { 
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllMaterias(res.data || []);
        setFilteredMaterias(res.data || []); // Inicialmente mostrar todas
      } catch (err) {
        toast.error("Error al cargar la lista de materias.");
      } finally {
        setLoadingMaterias(false);
      }
    };
    if (token) {
      fetchAllMaterias();
    }
  }, [token]);

  // Filtrar materias cuando cambia el año seleccionado
  useEffect(() => {
    if (!selectedAnio) {
      setFilteredMaterias(allMaterias); // Si no hay año, mostrar todas
    } else {
      const filtered = allMaterias.filter(m => String(m.anio) === selectedAnio);
      setFilteredMaterias(filtered);
    }
    setSelectedMateriaId(''); // Resetear materia al cambiar año
  }, [selectedAnio, allMaterias]);


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen space-y-6">
      {/* --- Encabezado del Panel Admin --- */}
      <div className="flex items-center gap-4">
          <div className="bg-sky-100 p-3 rounded-full">
            <GraduationCap className="h-8 w-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Notas (Admin)</h1>
            <p className="text-sm text-gray-500">
              Supervisar y modificar calificaciones. Los cambios quedan registrados.
            </p>
          </div>
      </div>

      {/* --- Filtros --- */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Filter size={18} /> Filtros de Selección
          </h2>
          {loadingMaterias ? (
              <div className="flex justify-center items-center h-20">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selector de Año */}
                  <div>
                      <label htmlFor="anio-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Año
                      </label>
                      <select
                          id="anio-select"
                          value={selectedAnio}
                          onChange={(e) => setSelectedAnio(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                      >
                          <option value="">Todos los Años</option>
                          {aniosDisponibles.map(anio => (
                              <option key={anio} value={anio}>{anio}° Año</option>
                          ))}
                      </select>
                  </div>

                  {/* Selector de Materia (filtrado por año) */}
                  <div>
                      <label htmlFor="materia-select-admin" className="block text-sm font-medium text-gray-700 mb-1">
                          Materia
                      </label>
                      <select
                          id="materia-select-admin"
                          value={selectedMateriaId}
                          onChange={(e) => setSelectedMateriaId(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                          disabled={!selectedAnio && allMaterias.length > 20} // Deshabilitar si hay muchas y no se filtró año
                      >
                          <option value=""> Selecciona una materia </option>
                          {filteredMaterias.map((m) => (
                              <option key={m._id} value={m._id}>
                                  {m.nombre} ({m.anio}° Año)
                              </option>
                          ))}
                      </select>
                       {!selectedAnio && allMaterias.length > 20 && (
                           <p className="text-xs text-gray-500 mt-1">Selecciona un año para ver las materias.</p>
                       )}
                  </div>
              </div>
          )}
      </div>

      {/* --- Tabla de Notas (Reutilizada) --- */}
      {selectedMateriaId ? (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
              {/* Pasamos la materia seleccionada y el rol 'admin' */}
              <CargarNotas 
                  materiaIdProp={selectedMateriaId} 
                  rolUsuario="admin" 
              />
          </div>
      ) : (
          <div className="text-center py-12 px-6 bg-white rounded-lg shadow border border-dashed border-gray-300">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Selecciona Año y Materia
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Usa los filtros de arriba para ver la tabla de notas.
                </p>
          </div>
      )}

    </div>
  );
};

export default AdminGestionNotas;