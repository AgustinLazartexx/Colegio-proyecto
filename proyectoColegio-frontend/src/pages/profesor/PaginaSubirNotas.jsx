import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { GraduationCap, Loader2, Search, BookOpen } from "lucide-react";
import CargarNotas from "./CargarNotas";
import { getMateriasProfesor } from "../../api/api";

const PaginaSubirNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Asumo que tu contexto devuelve 'user' o 'usuario'

  // Cargar materias del profesor al iniciar
  useEffect(() => {
    const fetchMaterias = async () => {
      setLoading(true);
      try {
        const res = await getMateriasProfesor();
        // Manejo flexible por si el backend devuelve array directo o un objeto
        const lista = Array.isArray(res.data) ? res.data : (res.data.materias || []);
        
        setMaterias(lista);

        // Si hay materias, seleccionamos la primera por defecto
        if (lista.length > 0) {
          setMateriaSeleccionadaId(lista[0]._id);
        }
      } catch (err) {
        console.error("Error cargando materias:", err);
        // Solo mostramos error si no es un 404 (que significaría que no tiene materias)
        if (err.response?.status !== 404) {
            toast.error("Error al cargar tus materias");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMaterias();
  }, [user]);

  // Buscamos el objeto completo de la materia seleccionada para mostrar info extra
  const materiaActual = materias.find(m => m._id === materiaSeleccionadaId);

  if (loading && materias.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="text-blue-600" />
                Gestión de Calificaciones
            </h1>
            <p className="text-gray-500 text-sm mt-1">Selecciona una materia para cargar notas.</p>
        </div>
      </div>

      {/* Selector de Materia */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
            Materia a calificar:
        </label>

        {materias.length === 0 ? (
             <div className="text-amber-700 bg-amber-50 p-4 rounded border border-amber-200">
                No tienes materias asignadas. Contacta al administrador.
             </div>
        ) : (
            <div className="flex flex-col md:flex-row gap-4">
                <select
                    value={materiaSeleccionadaId}
                    onChange={(e) => setMateriaSeleccionadaId(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 min-w-[250px]"
                >
                    {materias.map((m) => (
                        <option key={m._id} value={m._id}>
                            {m.nombre} ({m.anio}° {m.division})
                        </option>
                    ))}
                </select>
                
                {/* Tarjeta de Info Rápida */}
                {materiaActual && (
                    <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                        <span className="font-bold">{materiaActual.nombre}</span>
                        <span className="w-px h-4 bg-blue-300"></span>
                        <span>Año: {materiaActual.anio}°</span>
                        <span className="w-px h-4 bg-blue-300"></span>
                        <span>Div: {materiaActual.division || "U"}</span>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Renderizado de la Planilla */}
      {materiaSeleccionadaId ? (
        <CargarNotas 
            materiaId={materiaSeleccionadaId} 
            materiaNombre={materiaActual?.nombre} // Pasamos el nombre para no buscarlo de nuevo
            anio={materiaActual?.anio}
            division={materiaActual?.division}
        />
      ) : (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
            <Search className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Selecciona una materia para comenzar</p>
        </div>
      )}
    </div>
  );
};

export default PaginaSubirNotas;