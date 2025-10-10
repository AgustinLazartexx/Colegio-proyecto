import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { GraduationCap, Save, Frown, Search } from "lucide-react";

// --- Componentes internos para un código más limpio ---

// Componente para mostrar mientras se cargan los datos de los alumnos
const SkeletonLoader = () => (
  <div className="space-y-3 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
        <div className="w-24 h-8 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

// Componente para mostrar cuando no hay alumnos en una materia
const EmptyState = ({ message }) => (
  <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed">
    <Frown className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
    <p className="mt-1 text-sm text-gray-500">
      Asegúrate de que los alumnos estén inscriptos correctamente.
    </p>
  </div>
);

// --- Componente Principal ---

const CargarNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { token } = useAuth(); // Es mejor obtener el token del contexto si es posible

  // Traer materias del profesor
  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/materias/profesor/materias", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterias(res.data);
      } catch (err) {
        toast.error("Error al cargar materias. Intente de nuevo.");
      }
    };
    fetchMaterias();
  }, [token]);

  // Traer alumnos de la materia seleccionada
  const handleMateriaChange = async (e) => {
    const id = e.target.value;
    setMateriaSeleccionada(id);
    setNotas({});
    setAlumnos([]);
    if (!id) return;

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/materias/${id}/alumnos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlumnos(res.data);
      // Opcional: Cargar notas existentes si las hubiera
    } catch (err) {
      toast.error("Error al obtener la lista de alumnos.");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios de notas
  const handleNotaChange = (alumnoId, valor) => {
    // Validar que la nota sea un número entre 0 y 10 (o tu rango)
    const notaNumerica = Number(valor);
    if (valor === "" || (notaNumerica >= 0 && notaNumerica <= 10)) {
      setNotas((prev) => ({ ...prev, [alumnoId]: valor }));
    }
  };

  // Guardar todas las notas
  const guardarNotas = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post(
        "http://localhost:5000/api/notas/cargar",
        { materiaId: materiaSeleccionada, notas },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Notas guardadas correctamente");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Error al guardar las notas.";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* --- Encabezado --- */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-sky-100 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cargar Notas</h1>
              <p className="text-sm text-gray-500">
                Selecciona una materia para comenzar a calificar a tus alumnos.
              </p>
            </div>
          </div>
        </div>

        {/* --- Formulario y Tabla --- */}
        <form onSubmit={guardarNotas}>
          {/* --- Selector de Materia --- */}
          <div className="p-6">
            <label htmlFor="materia-select" className="block text-sm font-medium text-gray-700 mb-2">
              Materia
            </label>
            <select
              id="materia-select"
              value={materiaSeleccionada}
              onChange={handleMateriaChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            >
              <option value="">-- Selecciona una materia --</option>
              {materias.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* --- Contenido Dinámico: Loader, Tabla o Mensaje --- */}
          <div className="px-6 pb-6">
            {loading ? (
              <SkeletonLoader />
            ) : alumnos.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Alumno
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">
                        Nota (0-10)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alumnos.map((alumno) => (
                      <tr key={alumno._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={`https://ui-avatars.com/api/?name=${alumno.nombre}&background=random`}
                              alt="Avatar"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{alumno.nombre}</div>
                              <div className="text-sm text-gray-500">{alumno.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            placeholder="-"
                            min="0"
                            max="10"
                            step="0.01"
                            className="w-24 p-2 text-center border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            value={notas[alumno._id] || ""}
                            onChange={(e) => handleNotaChange(alumno._id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : materiaSeleccionada ? (
              <EmptyState message="No se encontraron alumnos" />
            ) : (
              <div className="text-center py-12 px-6 bg-sky-50 rounded-lg border border-dashed border-sky-200">
                <Search className="mx-auto h-12 w-12 text-sky-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Comienza seleccionando una materia
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  La lista de alumnos aparecerá aquí.
                </p>
              </div>
            )}
          </div>

          {/* --- Botón de Guardar --- */}
          {alumnos.length > 0 && (
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                <Save size={20} />
                {isSaving ? "Guardando..." : "Guardar Notas"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CargarNotas;