import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { GraduationCap, Loader2, Search, BookOpen } from "lucide-react";
import CargarNotas from "./CargarNotas";

// Importar funciones de API
import { getMateriasProfesor } from "../../api/api";

const PaginaSubirNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [loading, setLoading] = useState(false);
  const { usuario } = useAuth();

  // Cargar materias del profesor logueado
  useEffect(() => {
    const fetchMaterias = async () => {
      // Si no hay usuario cargado aún, esperamos
      if (!usuario) return;

      setLoading(true);
      try {
        const res = await getMateriasProfesor();
        
        // Corrección: Manejo flexible de la respuesta del backend
        // Puede venir como res.data (array directo) o res.data.materias (objeto)
        const listaMaterias = Array.isArray(res.data) 
            ? res.data 
            : (res.data.materias || []);

        setMaterias(listaMaterias);
        
        // Si hay materias, preseleccionar la primera automáticamente
        if (listaMaterias.length > 0) {
          setMateriaSeleccionada(listaMaterias[0]._id);
        }
      } catch (err) {
        console.error("Error al cargar materias:", err);
        // No mostrar toast de error si es simplemente que no tiene materias (404)
        if (err.response?.status !== 404) {
             toast.error(err.response?.data?.msg || "Error al cargar materias");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterias();
  }, [usuario]); // Importante: ejecutar cuando 'usuario' cambie o esté listo

  // Obtener información de la materia seleccionada
  const materiaActual = materias.find(m => m._id === materiaSeleccionada);

  if (loading && materias.length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-lg">
             <GraduationCap className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subir Notas</h1>
            {usuario && (
              <p className="text-sm text-gray-500">
                Panel de {usuario.nombre} {usuario.apellido}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Selector de Materia */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label 
          htmlFor="materia-select" 
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Seleccione la Materia a calificar:
        </label>
        
        {materias.length === 0 ? (
          <div className="text-amber-600 p-4 bg-amber-50 rounded border border-amber-200 flex items-center gap-2">
            <BookOpen size={20}/>
            <div>
                <p className="font-medium">No tiene materias asignadas.</p>
                <p className="text-xs">Contacte al administrador para la asignación de cursos.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <select
                id="materia-select"
                value={materiaSeleccionada}
                onChange={(e) => setMateriaSeleccionada(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                disabled={loading}
                >
                <option value="">-- Seleccionar --</option>
                {materias.map((m) => (
                    <option key={m._id} value={m._id}>
                    {m.nombre} ({m.anio}° {m.division || "U"})
                    </option>
                ))}
                </select>
                
                {/* Info rápida de la materia */}
                {materiaActual && (
                     <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-bold text-blue-800">{materiaActual.nombre}</h3>
                        <p className="text-sm text-blue-600">Año: {materiaActual.anio}°</p>
                        <p className="text-sm text-blue-600">División: {materiaActual.division || "Única"}</p>
                     </div>
                )}
            </div>

            <div className="lg:col-span-2">
                 {/* Renderizado de la Planilla (Componente Hijo) */}
                {materiaSeleccionada ? (
                    <CargarNotas materiaIdProp={materiaSeleccionada} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-8">
                        <Search className="h-10 w-10 mb-2 opacity-50" />
                        <p>Selecciona una materia del listado para cargar datos.</p>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaginaSubirNotas;