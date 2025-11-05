import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext"; // Ajusta la ruta
import { toast } from "react-toastify";
import { GraduationCap, Loader2, Search } from "lucide-react";
import CargarNotas from "./CargarNotas"; // Importa el componente "hijo"

const PaginaSubirNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth(); // Obtén el token

  // 1. Cargar las materias (igual que el Admin, pero solo las del profe)
  useEffect(() => {
    const fetchMaterias = async () => {
      if (!token) return;
      setLoading(true);
      try {
        // Este endpoint trae solo las materias del profesor logueado
        const res = await axios.get("http://localhost:5000/api/materias/profesor/materias", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterias(res.data);
      } catch (err) {
        toast.error("Error al cargar materias");
      } finally {
        setLoading(false);
      }
    };
    fetchMaterias();
  }, [token]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <GraduationCap className="w-8 h-8 text-sky-600" />
        <h1 className="text-3xl font-bold text-gray-900">Subir Notas</h1>
      </div>
      
      {/* 2. Selector de Materia (igual que el Admin) */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <label htmlFor="materia-select" className="block text-sm font-medium text-gray-700 mb-2">
          1. Seleccione la Materia
        </label>
        <select
          id="materia-select"
          value={materiaSeleccionada}
          onChange={(e) => setMateriaSeleccionada(e.target.value)}
          className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
          disabled={loading}
        >
          <option value="">{loading ? "Cargando materias..." : "Seleccionar una materia..."}</option>
          {materias.map((m) => (
            <option key={m._id} value={m._id}>
              {m.nombre} (Año: {m.anio})
            </option>
          ))}
        </select>
      </div>

      {/* 3. Renderizado Condicional (igual que el Admin) */}
      {materiaSeleccionada ? (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {/* Aquí pasamos la prop al componente 'hijo' */}
          <CargarNotas materiaIdProp={materiaSeleccionada} />
        </div>
      ) : (
        <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Seleccione una materia para ver la planilla de notas.
          </h3>
        </div>
      )}
    </div>
  );
};

export default PaginaSubirNotas;