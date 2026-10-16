import React, { useEffect, useState } from "react";
import SidebarAlumno from "../../components/sidebar/SidebarAlumno"; // Ajusta la ruta si es necesario
import { getMisClasesAlumno } from "../../api/api";
import { Calendar, Clock, User, BookOpen, MapPin } from "lucide-react";

const MisClases = () => {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarClases = async () => {
      try {
        const res = await getMisClasesAlumno();
        setClases(res.data);
      } catch (err) {
        console.error("Error al cargar clases:", err);
      } finally {
        setLoading(false);
      }
    };
    cargarClases();
  }, []);

  // Función para ordenar los días correctamente
  const ordenDias = { "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6 };
  
  // Agrupar clases por día
  const clasesPorDia = clases.reduce((acc, clase) => {
    const dia = clase.diaSemana || "Sin Día";
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(clase);
    return acc;
  }, {});

  // Ordenar los días para pintarlos en orden (Lunes primero)
  const diasOrdenados = Object.keys(clasesPorDia).sort((a, b) => {
    return (ordenDias[a] || 7) - (ordenDias[b] || 7);
  });

  return (
    <div className="flex h-screen bg-gray-100">
    
      
      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" /> Mi Cronograma de Clases
          </h1>
          <p className="text-gray-600 mt-2">Horarios y materias asignadas a tu curso.</p>
        </header>

        {loading ? (
          <p className="text-gray-500">Cargando horario...</p>
        ) : diasOrdenados.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
            No tienes clases asignadas todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diasOrdenados.map((dia) => (
              <div key={dia} className="bg-white rounded-xl shadow-sm border-t-4 border-blue-500 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-100">
                  <h2 className="font-bold text-xl text-gray-800">{dia}</h2>
                </div>
                <div className="p-4 space-y-4">
                  {clasesPorDia[dia]
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)) // Ordenar por hora
                    .map((clase) => (
                    <div key={clase._id} className="relative pl-4 border-l-2 border-gray-200 hover:border-blue-400 transition-colors">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-600"/>
                        {clase.materia?.nombre || "Materia"}
                      </h3>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock size={14} /> 
                          <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                            {clase.horaInicio} - {clase.horaFin}
                          </span>
                        </p>
                        
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <User size={14} />
                          {/* --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE PARA LEER ARRAY --- */}
                          {clase.profesores && clase.profesores.length > 0 
                            ? clase.profesores.map(p => p.nombre).join(", ") 
                            : "Sin asignar"}
                        </p>

                        {clase.aula && (
                          <p className="text-xs text-gray-400 flex items-center gap-2 pt-1">
                            <MapPin size={12} /> Aula: {clase.aula}
                          </p>
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
    </div>
  );
};

export default MisClases;