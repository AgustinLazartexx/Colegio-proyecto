import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { GraduationCap, Loader2, Search, BookOpen, Filter, ListChecks } from "lucide-react";
import CargarNotas from "./CargarNotas";
import { getMateriasProfesor } from "../../api/api";

const PaginaSubirNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ nombre: "", anio: "", division: "" });
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
  const hasActiveFilters = Object.values(filtros).some((value) => value.trim());
  const materiasFiltradas = materias.filter((materia) =>
    (!filtros.nombre || materia.nombre.toLowerCase().includes(filtros.nombre.trim().toLowerCase())) &&
    (!filtros.anio || String(materia.anio) === filtros.anio) &&
    (!filtros.division || String(materia.division || "").toUpperCase() === filtros.division)
  );

  const actualizarFiltro = (campo, valor) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
    setMateriaSeleccionadaId("");
  };

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
            <p className="text-gray-500 text-sm mt-1">Filtra tus materias y elige una para cargar notas.</p>
        </div>
      </div>

      {/* Selector de Materia */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
            Busca y selecciona la materia a calificar:
        </label>

        {materias.length === 0 ? (
             <div className="text-amber-700 bg-amber-50 p-4 rounded border border-amber-200">
                No tienes materias asignadas. Contacta al administrador.
             </div>
        ) : (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="relative">
                        <span className="sr-only">Buscar por materia</span>
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={filtros.nombre}
                            onChange={(e) => actualizarFiltro("nombre", e.target.value)}
                            placeholder="Buscar materia..."
                            className="w-full py-3 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </label>
                    <label className="relative">
                        <span className="sr-only">Filtrar por año</span>
                        <Filter size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={filtros.anio}
                            onChange={(e) => actualizarFiltro("anio", e.target.value)}
                            className="w-full py-3 pl-10 pr-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Todos los años</option>
                            {[...new Set(materias.map((materia) => String(materia.anio)).filter(Boolean))].sort().map((anio) => (
                                <option key={anio} value={anio}>{anio}° año</option>
                            ))}
                        </select>
                    </label>
                    <label className="relative">
                        <span className="sr-only">Filtrar por división</span>
                        <ListChecks size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={filtros.division}
                            onChange={(e) => actualizarFiltro("division", e.target.value)}
                            className="w-full py-3 pl-10 pr-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Todas las divisiones</option>
                            {[...new Set(materias.map((materia) => String(materia.division || "").toUpperCase()).filter(Boolean))].sort().map((division) => (
                                <option key={division} value={division}>División {division}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <p className="text-sm text-blue-600" aria-live="polite">
                    {hasActiveFilters ? `${materiasFiltradas.length} materia${materiasFiltradas.length === 1 ? "" : "s"} encontrada${materiasFiltradas.length === 1 ? "" : "s"}` : "Usa los filtros para encontrar la materia antes de cargar notas."}
                </p>
                {hasActiveFilters && materiasFiltradas.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <select
                    value={materiaSeleccionadaId}
                    onChange={(e) => setMateriaSeleccionadaId(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 min-w-[250px]"
                >
                    <option value="">Seleccionar materia</option>
                    {materiasFiltradas.map((m) => (
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
                {hasActiveFilters && materiasFiltradas.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500 animate-in fade-in duration-300">
                        No hay materias asignadas que coincidan con esos filtros.
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