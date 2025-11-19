import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { Loader2, Calendar, Clock } from "lucide-react"; 
import { getTodasLasClases, getMisClases } from '../../api/api'; 

// Helpers
const diasSemana = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7 };
const getHoraInicio = (clase) => clase?.horaInicio || "00:00";
const esHoy = (dia) => new Date().getDay() === diasSemana[dia];

const Clases = () => {
  // CORRECCIÓN 1: Usar 'usuario' en lugar de 'user'
  const { usuario } = useAuth(); 
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para filtros opcionales
  const [filtros, setFiltros] = useState({ diaSemana: "", anio: "" });

  useEffect(() => {
    const cargarClases = async () => {
      // CORRECCIÓN 2: Validar contra 'usuario'
      if (!usuario) return;
      
      setLoading(true);
      setError(null);

      try {
        let res;
        // CORRECCIÓN 3: Usar 'usuario.rol'
        if (usuario.rol === 'admin') {
           res = await getTodasLasClases();
        } else {
           res = await getMisClases();
        }

        // Manejo robusto: A veces el backend devuelve { clases: [] } y a veces el array directo
        const data = res.data.clases || res.data || [];
        
        if (Array.isArray(data)) {
            setClases(data);
        } else {
            console.error("Formato de datos inesperado:", data);
            setClases([]);
        }

      } catch (err) {
        console.error("Error cargando clases:", err);
        const msg = err.response?.data?.msg || "No se pudieron cargar las clases.";
        
        if (err.response?.status === 403) {
            setError("No tienes permisos para ver estas clases.");
        } else if (err.response?.status === 404) {
            // Si es 404, es que no tiene clases, no es un error grave
            setClases([]); 
        } else {
            setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    cargarClases();
  }, [usuario]); // Dependencia corregida a 'usuario'

  // --- Lógica de Filtrado y Agrupación ---
  const clasesFiltradas = clases.filter((clase) => {
    const cumpleDia = !filtros.diaSemana || clase.diaSemana === filtros.diaSemana;
    const cumpleAnio = !filtros.anio || String(clase.anio) === filtros.anio;
    return cumpleDia && cumpleAnio;
  });
  
  const clasesAgrupadas = clasesFiltradas.reduce((acc, c) => {
    if (!c?.diaSemana) return acc;
    acc[c.diaSemana] ??= [];
    acc[c.diaSemana].push(c);
    return acc;
  }, {});
  
  // Ordenar días: Lunes primero, etc.
  const diasOrdenados = Object.keys(clasesAgrupadas).sort((a, b) => {
    return (diasSemana[a] || 99) - (diasSemana[b] || 99);
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-sky-600 w-8 h-8" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-center text-red-600 bg-red-50 rounded border border-red-200 mx-6 mt-6">
        {error}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
         <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <Calendar className="text-sky-600"/>
           {usuario?.rol === 'admin' ? 'Todas las Clases' : 'Mis Clases'}
         </h2>
         <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total: {clases.length}
         </span>
       </div>

       {clasesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No se encontraron clases programadas.</p>
          </div>
       ) : (
          <div className="grid gap-6">
            {diasOrdenados.map((dia) => (
               <div key={dia} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`px-6 py-3 border-b font-bold flex justify-between items-center ${esHoy(dia) ? 'bg-sky-50 text-sky-700' : 'bg-gray-50 text-gray-700'}`}>
                    <span className="uppercase tracking-wide text-sm">{dia}</span>
                    {esHoy(dia) && <span className="text-xs bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full font-bold">HOY</span>}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {clasesAgrupadas[dia]
                      .sort((a, b) => getHoraInicio(a).localeCompare(getHoraInicio(b)))
                      .map(clase => (
                        <div key={clase._id || clase.id} className="p-4 hover:bg-gray-50 transition-colors group">
                           <div className="flex justify-between items-start">
                               <div>
                                   <h4 className="font-bold text-lg text-gray-800 group-hover:text-sky-600 transition-colors">
                                       {clase.materia?.nombre || 'Materia Sin Nombre'}
                                   </h4>
                                   <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                       <span className="flex items-center gap-1">
                                           <Clock size={14} />
                                           {clase.horaInicio} - {clase.horaFin}
                                       </span>
                                       <span className="bg-gray-100 px-2 rounded text-gray-700">
                                           {clase.anio}° "{clase.division}"
                                       </span>
                                   </div>
                               </div>
                               
                               {/* Botón solo para Admin */}
                               {usuario?.rol === 'admin' && (
                                 <Link 
                                   to={`/admin/clases/${clase._id || clase.id}/gestionar`}
                                   className="px-3 py-1 text-xs font-medium text-sky-600 bg-sky-50 rounded hover:bg-sky-100 transition-colors"
                                 >
                                   Gestionar
                                 </Link>
                               )}
                           </div>
                        </div>
                    ))}
                  </div>
               </div>
            ))}
          </div>
       )}
    </div>
  );
};

export default Clases;