/// src/pages/profesor/VerAlumnosMateria.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { 
  Users, 
  BookOpen, 
  Mail, 
  GraduationCap,
  Search,
  UserCheck,
  Filter
} from "lucide-react";

const VerAlumnosMateria = () => {
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosFiltrados, setAlumnosFiltrados] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const { usuario } = useAuth();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMaterias = async () => {
      setLoading(true);
      try {
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
  }, []);

  useEffect(() => {
    if (!busqueda) {
      setAlumnosFiltrados(alumnos);
      return;
    }

    const filtrados = alumnos.filter(alumno =>
      alumno.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      alumno.email.toLowerCase().includes(busqueda.toLowerCase())
    );
    setAlumnosFiltrados(filtrados);
  }, [busqueda, alumnos]);

  const handleMateriaChange = async (e) => {
    const materiaId = e.target.value;
    setMateriaSeleccionada(materiaId);
    setBusqueda("");

    if (!materiaId) {
      setAlumnos([]);
      setAlumnosFiltrados([]);
      return;
    }

    setLoadingAlumnos(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/materias/${materiaId}/alumnos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlumnos(res.data);
      setAlumnosFiltrados(res.data);
    } catch (err) {
      toast.error("No se pudo obtener los alumnos");
      setAlumnos([]);
      setAlumnosFiltrados([]);
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const getMateriaSeleccionadaInfo = () => {
    return materias.find(m => m._id === materiaSeleccionada);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-full flex-shrink-0">
                <Users size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Estudiantes
              </h1>
            </div>
            <p className="text-gray-600 text-base mt-1 ml-12 sm:ml-0 sm:mt-2">
              Visualiza los estudiantes inscritos en tus materias.
            </p>
          </div>
        </div>

        {/* Selector de materia */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <BookOpen className="text-gray-500" size={20} />
              <h2 className="text-xl font-semibold text-gray-800">Seleccionar Materia</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="relative">
              <select
                value={materiaSeleccionada}
                onChange={handleMateriaChange}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none bg-white text-gray-900 text-base"
              >
                <option value="">Selecciona una materia...</option>
                {materias.map((materia) => (
                  <option key={materia._id} value={materia._id}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            {getMateriaSeleccionadaInfo() && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <GraduationCap className="text-blue-600" size={18} />
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm">
                      {getMateriaSeleccionadaInfo().nombre}
                    </h3>
                    <p className="text-blue-700 text-xs">
                      Materia seleccionada
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buscador y lista de alumnos */}
        {materiaSeleccionada && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="text-gray-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-800">
                  Estudiantes Inscritos
                </h2>
              </div>
              <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {alumnosFiltrados.length} 
                {busqueda && ` de ${alumnos.length}`}
              </span>
            </div>

            <div className="p-6">
              {loadingAlumnos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando estudiantes...</span>
                </div>
              ) : alumnos.length > 0 ? (
                <>
                  {/* Buscador */}
                  <div className="mb-5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar estudiante por nombre o email..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>

                  {/* Lista de alumnos */}
                  {alumnosFiltrados.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {alumnosFiltrados.map((alumno) => (
                        <div
                          key={alumno._id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-base">
                                {alumno.nombre.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base truncate">
                                {alumno.nombre}
                              </h3>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Mail size={14} />
                                <span className="text-sm truncate">{alumno.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="mx-auto text-gray-400 mb-4" size={40} />
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No se encontraron estudiantes
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Tu búsqueda "{busqueda}" no coincide con ningún estudiante.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={40} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    No hay estudiantes inscritos
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Esta materia aún no tiene estudiantes registrados.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado inicial */}
        {!materiaSeleccionada && !loading && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-5">
              <GraduationCap size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Selecciona una Materia
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Para comenzar, selecciona una de tus materias del menú desplegable de arriba 
              y podrás ver todos los estudiantes inscritos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerAlumnosMateria;