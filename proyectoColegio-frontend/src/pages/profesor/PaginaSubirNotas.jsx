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
      setLoading(true);
      try {
        // Usa la función de api.js que apunta a /materias/profesor/listado
        const res = await getMateriasProfesor();
        setMaterias(res.data || []);
        
        // Si hay materias, preseleccionar la primera automáticamente
        if (res.data && res.data.length > 0) {
          setMateriaSeleccionada(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error al cargar materias:", err);
        toast.error(err.response?.data?.msg || "Error al cargar materias");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterias();
  }, []);

  // Obtener información de la materia seleccionada
  const materiaActual = materias.find(m => m._id === materiaSeleccionada);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-sky-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subir Notas</h1>
            {usuario && (
              <p className="text-sm text-gray-600 mt-1">
                Profesor: {usuario.nombre}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Selector de Materia */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <label 
          htmlFor="materia-select" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Seleccione la Materia
        </label>
        
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando materias...</span>
          </div>
        ) : materias.length === 0 ? (
          <div className="text-gray-500 p-4 bg-gray-50 rounded border border-gray-200">
            <p>No tiene materias asignadas.</p>
            <p className="text-sm mt-1">
              Contacte al administrador para que le asigne materias.
            </p>
          </div>
        ) : (
          <>
            <select
              id="materia-select"
              value={materiaSeleccionada}
              onChange={(e) => setMateriaSeleccionada(e.target.value)}
              className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              disabled={loading}
            >
              <option value="">-- Seleccionar materia --</option>
              {materias.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.nombre} - {m.anio}° Año {m.division ? `"${m.division}"` : ""}
                </option>
              ))}
            </select>

            {/* Info de materia seleccionada */}
            {materiaActual && (
              <div className="mt-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-sky-900">
                      {materiaActual.nombre}
                    </p>
                    <p className="text-sky-700 mt-1">
                      Año: {materiaActual.anio}° 
                      {materiaActual.division && ` - División: ${materiaActual.division}`}
                    </p>
                    {materiaActual.descripcion && (
                      <p className="text-sky-600 text-xs mt-1">
                        {materiaActual.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Renderizado Condicional de la Planilla */}
      {materiaSeleccionada ? (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <CargarNotas materiaIdProp={materiaSeleccionada} />
        </div>
      ) : (
        <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-base font-medium text-gray-900">
            Seleccione una materia
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Elija una materia del menú desplegable para ver y gestionar las notas de sus alumnos.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaginaSubirNotas;