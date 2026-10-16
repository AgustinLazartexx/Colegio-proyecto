import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTodasLasClases, getMisClases, getAlumnosDeClase } from '../../api/api'; 
import { Calendar, Clock, X, Loader2, User, Search, Filter, BookOpen, GraduationCap } from "lucide-react";

const diasSemana = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7 };
const esHoy = (dia) => new Date().getDay() === diasSemana[dia];

const Clases = () => {
  const { usuario } = useAuth(); 
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ busqueda: "", anio: "", division: "", dia: "" });
  
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

  const hasActiveFilters = Object.values(filtros).some((value) => value.trim());
  const clasesFiltradas = listaClases.filter((clase) => {
    const materia = clase.materia?.nombre || "";
    return (
      (!filtros.busqueda || materia.toLowerCase().includes(filtros.busqueda.trim().toLowerCase())) &&
      (!filtros.anio || String(clase.anio) === filtros.anio) &&
      (!filtros.division || String(clase.division || "").toUpperCase() === filtros.division) &&
      (!filtros.dia || clase.diaSemana === filtros.dia)
    );
  });

  const clasesAgrupadas = clasesFiltradas.reduce((acc, c) => {
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
         <div className="space-y-6">
           <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
             <div className="mb-4 flex items-center gap-2 text-gray-800">
               <Filter size={18} className="text-indigo-600" />
               <h3 className="font-semibold">Filtrar mis clases</h3>
             </div>
             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
               <label className="relative">
                 <span className="sr-only">Buscar por materia</span>
                 <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                   value={filtros.busqueda}
                   onChange={(event) => setFiltros((actuales) => ({ ...actuales, busqueda: event.target.value }))}
                   placeholder="Buscar materia..."
                   className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                 />
               </label>
               <select
                 aria-label="Filtrar por año"
                 value={filtros.anio}
                 onChange={(event) => setFiltros((actuales) => ({ ...actuales, anio: event.target.value }))}
                 className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
               >
                 <option value="">Todos los años</option>
                 {[...new Set(listaClases.map((clase) => String(clase.anio)).filter(Boolean))].sort().map((anio) => <option key={anio} value={anio}>{anio}° año</option>)}
               </select>
               <select
                 aria-label="Filtrar por división"
                 value={filtros.division}
                 onChange={(event) => setFiltros((actuales) => ({ ...actuales, division: event.target.value }))}
                 className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
               >
                 <option value="">Todas las divisiones</option>
                 {[...new Set(listaClases.map((clase) => String(clase.division || "").toUpperCase()).filter(Boolean))].sort().map((division) => <option key={division} value={division}>División {division}</option>)}
               </select>
               <select
                 aria-label="Filtrar por día"
                 value={filtros.dia}
                 onChange={(event) => setFiltros((actuales) => ({ ...actuales, dia: event.target.value }))}
                 className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
               >
                 <option value="">Todos los días</option>
                 {Object.keys(diasSemana).map((dia) => <option key={dia} value={dia}>{dia}</option>)}
               </select>
             </div>
             <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
               <p className="text-sm text-indigo-600">
                 {hasActiveFilters ? `${clasesFiltradas.length} clase${clasesFiltradas.length === 1 ? "" : "s"} encontrada${clasesFiltradas.length === 1 ? "" : "s"}` : "Elige uno o más filtros para mostrar resultados."}
               </p>
               {hasActiveFilters && (
                 <button
                   type="button"
                   onClick={() => setFiltros({ busqueda: "", anio: "", division: "", dia: "" })}
                   className="text-sm font-medium text-gray-500 hover:text-indigo-600"
                 >
                   Limpiar filtros
                 </button>
               )}
             </div>
           </div>
           {!hasActiveFilters ? (
             <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-white to-indigo-50 px-6 py-14 text-center animate-in fade-in zoom-in duration-500">
               <div className="mb-5 rounded-full bg-white p-5 shadow-sm">
                 <BookOpen size={38} className="text-indigo-500 animate-pulse" />
               </div>
               <h3 className="text-lg font-semibold text-gray-800">Tus clases, a tu manera</h3>
               <p className="mt-2 max-w-md text-sm text-gray-500">Busca por materia o combina año, división y día para consultar tu cronograma.</p>
             </div>
           ) : diasOrdenados.length === 0 ? (
             <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-sm animate-in fade-in duration-300">
               <GraduationCap size={40} className="mb-3 text-gray-300" />
               <p className="font-semibold text-gray-800">No hay clases para esos filtros</p>
               <p className="mt-1 text-sm text-gray-500">Prueba con otros criterios de búsqueda.</p>
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