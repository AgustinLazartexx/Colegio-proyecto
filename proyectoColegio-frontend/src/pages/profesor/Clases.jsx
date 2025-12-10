import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTodasLasClases, getMisClases, getAlumnosDeClase } from '../../api/api'; 
import { Calendar, Clock, X, Loader2, User } from "lucide-react"; 

const diasSemana = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7 };
const esHoy = (dia) => new Date().getDay() === diasSemana[dia];

const Clases = () => {
  const { usuario } = useAuth(); 
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [alumnosModal, setAlumnosModal] = useState({ visible: false, data: [], loading: false, materiaNombre: '' });

  useEffect(() => {
    const cargarClases = async () => {
      if (!usuario) return;
      
      setLoading(true);
      setError(null);
      try {
        const res = usuario.rol === 'admin' ? await getTodasLasClases() : await getMisClases();
        const data = res.data.clases || res.data || [];
        
        if (Array.isArray(data)) {
            setClases(data);
        } else {
            setClases([]);
        }
      } catch (err) {
        console.error("Error cargando clases:", err);
        setError("No se pudieron cargar las clases.");
      } finally {
        setLoading(false);
      }
    };

    cargarClases();
  }, [usuario]);

  const verAlumnos = async (claseId, materiaNombre) => {
    setAlumnosModal({ visible: true, data: [], loading: true, materiaNombre });
    try {
      const res = await getAlumnosDeClase(claseId);
      const lista = Array.isArray(res.data) ? res.data : (res.data.alumnos || []);
      setAlumnosModal({ visible: true, data: lista, loading: false, materiaNombre });
    } catch (error) {
      console.error("Error cargando alumnos:", error);
      setAlumnosModal(prev => ({ ...prev, loading: false }));
      // Opcional: toast.error("Error al ver alumnos");
    }
  };

  const listaClases = Array.isArray(clases) ? clases : [];

  const clasesAgrupadas = listaClases.reduce((acc, c) => {
    if (!c || !c.diaSemana) return acc;
    acc[c.diaSemana] = acc[c.diaSemana] || [];
    acc[c.diaSemana].push(c);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(clasesAgrupadas).sort((a, b) => (diasSemana[a] || 99) - (diasSemana[b] || 99));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded m-6">
        {error}
    </div>
  );

  return (
    <div className="p-6">
       <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
         <Calendar className="text-blue-600"/> Mis Horarios y Clases
       </h2>

       {listaClases.length === 0 ? (
         <div className="text-center py-12 bg-gray-50 rounded border border-dashed">
           <p className="text-gray-500">No tienes clases asignadas aún.</p>
         </div>
       ) : (
         <div className="grid gap-6">
           {diasOrdenados.map((dia) => (
              <div key={dia} className={`bg-white rounded-lg shadow-sm border ${esHoy(dia) ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}>
                 <div className={`px-6 py-3 font-bold border-b flex justify-between ${esHoy(dia) ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-700'}`}>
                   <span>{dia}</span>
                   {esHoy(dia) && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">HOY</span>}
                 </div>
                 <div className="divide-y divide-gray-100">
                   {clasesAgrupadas[dia].map(clase => (
                       // CORRECCIÓN: Usar clase.id || clase._id
                       <div key={clase.id || clase._id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                  <h4 className="font-bold text-lg text-gray-900">
                                      {clase.materia?.nombre || 'Materia sin nombre'}
                                  </h4>
                                  <div className="text-sm text-gray-600 flex flex-wrap gap-4 mt-1">
                                      <span className="flex items-center gap-1">
  <Clock size={16} className="text-gray-400"/> 
  {/* Usamos 'horario' o un fallback por si acaso */}
  {clase.horario || `${clase.horaInicio || '?'} - ${clase.horaFin || '?'}`}
</span>
                                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 border border-gray-200">
                                          {clase.anio}° "{clase.division}"
                                      </span>
                                  </div>
                              </div>
                              <button 
                                onClick={() => verAlumnos(clase.id || clase._id, clase.materia?.nombre)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2 transition-colors"
                              >
                                <User size={16}/> Ver Alumnos
                              </button>
                          </div>
                       </div>
                   ))}
                 </div>
              </div>
           ))}
         </div>
       )}

       {/* MODAL DE ALUMNOS */}
       {alumnosModal.visible && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
               <h3 className="font-bold text-lg text-gray-800">Alumnos: {alumnosModal.materiaNombre}</h3>
               <button 
                 onClick={() => setAlumnosModal(prev => ({...prev, visible: false}))}
                 className="p-1 hover:bg-gray-200 rounded-full transition-colors"
               >
                 <X size={20}/>
               </button>
             </div>
             <div className="p-0 max-h-[60vh] overflow-y-auto">
               {alumnosModal.loading ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600"/></div>
               ) : alumnosModal.data.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">No hay alumnos inscritos en esta clase.</div>
               ) : (
                 <ul className="divide-y divide-gray-100">
                   {alumnosModal.data.map(alumno => (
                     <li key={alumno._id} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                       <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                         {alumno.nombre?.charAt(0).toUpperCase()}{alumno.apellido?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-semibold text-gray-900">{alumno.nombre} {alumno.apellido}</p>
                         <p className="text-xs text-gray-500">{alumno.email}</p>
                       </div>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default Clases;