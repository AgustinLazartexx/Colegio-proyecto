// src/pages/profesor/VerAlumnosMateria.jsx
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
  Calendar,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Users className="text-white" size={28} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Gestión de Estudiantes
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Visualiza y gestiona los estudiantes inscritos en tus materias
          </p>
        </div>

        {/* Selector de materia */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <BookOpen className="text-white" size={24} />
              <h2 className="text-2xl font-bold text-white">Seleccionar Materia</h2>
            </div>
            <p className="text-blue-100 mt-2">Elige una materia para ver sus estudiantes</p>
          </div>
          
          <div className="p-8">
            <div className="relative">
              <select
                value={materiaSeleccionada}
                onChange={handleMateriaChange}
                className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all appearance-none bg-white text-gray-900 text-lg"
              >
                <option value="">Selecciona una materia...</option>
                {materias.map((materia) => (
                  <option key={materia._id} value={materia._id}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            
            {getMateriaSeleccionadaInfo() && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="text-blue-600" size={20} />
                  <div>
                    <h3 className="font-bold text-blue-900">
                      {getMateriaSeleccionadaInfo().nombre}
                    </h3>
                    <p className="text-blue-700 text-sm">
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
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="text-white" size={24} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Estudiantes Inscritos
                    </h2>
                    <p className="text-indigo-100">
                      {alumnosFiltrados.length} estudiante{alumnosFiltrados.length !== 1 ? 's' : ''} 
                      {busqueda && ` (filtrados de ${alumnos.length})`}
                    </p>
                  </div>
                </div>
                {alumnos.length > 0 && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <span className="text-white font-bold text-lg">
                      {alumnos.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8">
              {loadingAlumnos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando estudiantes...</span>
                </div>
              ) : alumnos.length > 0 ? (
                <>
                  {/* Buscador */}
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar estudiante por nombre o email..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                  </div>

                  {/* Lista de alumnos */}
                  {alumnosFiltrados.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {alumnosFiltrados.map((alumno, index) => (
                        <div
                          key={alumno._id}
                          className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-lg">
                                {alumno.nombre.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">
                                {alumno.nombre}
                              </h3>
                              <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <Mail size={16} />
                                <span className="text-sm truncate">{alumno.email}</span>
                              </div>
                              <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full inline-block">
                                Estudiante #{index + 1}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        No se encontraron estudiantes
                      </h3>
                      <p className="text-gray-600">
                        Tu búsqueda "{busqueda}" no coincide con ningún estudiante.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No hay estudiantes inscritos
                  </h3>
                  <p className="text-gray-600">
                    Esta materia aún no tiene estudiantes registrados.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado inicial */}
        {!materiaSeleccionada && !loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <GraduationCap size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Selecciona una Materia
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
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