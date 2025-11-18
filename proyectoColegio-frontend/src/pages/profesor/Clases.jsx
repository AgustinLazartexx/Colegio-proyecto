import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react"; // Asumiendo que usas lucide-react, si no, usa tu loader
import Swal from 'sweetalert2';

// IMPORTAR LAS NUEVAS FUNCIONES
import { getTodasLasClases, getMisClases } from '../../api/api'; 

// ... (Tus helpers de fecha y hora se mantienen igual) ...
const diasSemana = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7 };
const getHoraInicio = (clase) => clase?.horaInicio || "00:00";
const esHoy = (dia) => new Date().getDay() === diasSemana[dia];

const Clases = () => {
  const { user } = useAuth(); // Necesitamos el usuario para ver el rol
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ diaSemana: "", anio: "" });

  useEffect(() => {
    const cargarClases = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        let res;
        // LÓGICA CONDICIONAL: Evita el error 403 llamando al endpoint correcto
        if (user.rol === 'admin') {
           res = await getTodasLasClases();
        } else {
           res = await getMisClases();
        }

        // Manejo robusto de la respuesta (puede venir como array directo o dentro de .clases)
        const data = res.data.clases || res.data || [];
        setClases(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.msg || "No se pudieron cargar las clases.";
        // Si es 403 o 404, mostrar un mensaje amigable en lugar de explotar
        if (err.response?.status === 403) {
            setError("No tienes permisos para ver estas clases.");
        } else {
            setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    cargarClases();
  }, [user]); // Ejecutar cuando el usuario esté listo

  // ... (Tu lógica de filtrado y renderizado se mantiene igual abajo) ...
  
  // --- Filtrado ---
  const clasesFiltradas = clases.filter((clase) => {
    const cumpleDia = !filtros.diaSemana || clase.diaSemana === filtros.diaSemana;
    const cumpleAnio = !filtros.anio || String(clase.anio) === filtros.anio;
    return cumpleDia && cumpleAnio;
  });
  
  // Agrupación por día
  const clasesAgrupadas = clasesFiltradas.reduce((acc, c) => {
    if (!c?.diaSemana) return acc;
    acc[c.diaSemana] ??= [];
    acc[c.diaSemana].push(c);
    return acc;
  }, {});
  
  const diasOrdenados = Object.keys(clasesAgrupadas).sort((a, b) => {
    return (diasSemana[a] || 99) - (diasSemana[b] || 99);
  });
  
  const aniosUnicos = [...new Set(clases.map((c) => c.anio))].filter(Boolean).sort((a, b) => a - b);


  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="p-6 text-center text-red-600 bg-red-50 rounded">{error}</div>;

  return (
    <div className="p-6 space-y-6">
       {/* ... (Aquí va tu JSX de filtros y listado igual que antes) ... */}
       
       {/* Ejemplo rápido de tu JSX para verificar que no falte nada crítico */}
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">
           {user.rol === 'admin' ? 'Todas las Clases' : 'Mis Clases'}
         </h2>
       </div>

       {/* ... Filtros ... */}

       {clasesFiltradas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay clases disponibles.</p>
       ) : (
          <div className="space-y-6">
            {diasOrdenados.map((dia) => (
               <div key={dia} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-3 bg-gray-50 border-b font-bold flex justify-between">
                    <span>{dia}</span>
                    {esHoy(dia) && <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded-full">Hoy</span>}
                  </div>
                  <div className="divide-y">
                    {clasesAgrupadas[dia]
                      .sort((a, b) => getHoraInicio(a).localeCompare(getHoraInicio(b)))
                      .map(clase => (
                        <div key={clase._id || clase.id} className="p-4 hover:bg-gray-50">
                           <h4 className="font-bold">{clase.materia?.nombre || 'Sin nombre'}</h4>
                           <p className="text-sm text-gray-600">{clase.anio}° {clase.division} - {clase.horaInicio} a {clase.horaFin}</p>
                           
                           {/* Botón solo para Admin */}
                           {user.rol === 'admin' && (
                             <Link 
                               to={`/admin/clases/${clase._id || clase.id}/gestionar`}
                               className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                             >
                               Gestionar Alumnos
                             </Link>
                           )}
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