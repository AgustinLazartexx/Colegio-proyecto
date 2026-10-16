import { useEffect, useState } from "react";
import { getMisClasesAlumno } from "../../api/api";
import { Calendar, Clock, User, BookOpen } from "lucide-react"; // Íconos para que se vea moderno

const CronogramaAlumno = () => {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarClases = async () => {
      try {
        const res = await getMisClasesAlumno();
        setClases(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el horario.");
      } finally {
        setLoading(false);
      }
    };
    cargarClases();
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Cargando tu agenda...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (clases.length === 0) return <div className="p-4 text-center text-gray-500">No tienes clases asignadas aún.</div>;

  // Ordenar días para mostrar (Lunes primero)
  const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  
  // Agrupar clases por día
  const clasesPorDia = diasOrden.reduce((acc, dia) => {
    const clasesDelDia = clases.filter(c => c.dia === dia);
    if (clasesDelDia.length > 0) {
      // Ordenar por horario de inicio dentro del día
      acc[dia] = clasesDelDia.sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
    }
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Calendar className="text-accent" /> Mi Horario Semanal
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(clasesPorDia).length > 0 ? (
          Object.entries(clasesPorDia).map(([dia, listaClases]) => (
            <div key={dia} className="bg-gray-50 rounded-lg p-4 border-t-4 border-accent">
              <h3 className="font-bold text-lg text-gray-700 mb-3 border-b pb-2">{dia}</h3>
              <div className="space-y-3">
                {listaClases.map((clase) => (
                  <div key={clase._id} className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-accent flex items-center gap-1 text-sm">
                           <BookOpen size={14}/> {clase.materia?.nombre || "Materia sin nombre"}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Clock size={12} /> {clase.horarioInicio} - {clase.horarioFin} hs
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
  <User size={12} /> 
  {/* Lógica nueva: Si hay profesores, mapeamos sus nombres, sino mostramos "A designar" */}
  Prof. {clase.profesores && clase.profesores.length > 0 
    ? clase.profesores.map(p => p.nombre).join(", ") 
    : "A designar"}
</div>
                    {clase.aula && (
                       <div className="mt-2 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                         Aula: {clase.aula}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
            <p className="col-span-full text-center text-gray-500">No hay clases para mostrar en los días hábiles.</p>
        )}
      </div>
    </div>
  );
};

export default CronogramaAlumno;