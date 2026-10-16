import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  Users,
  Edit,
  Trash2,
  Plus,
  Loader2,
  BookOpen,
  User,
  Filter,
  X
} from "lucide-react";

// Importar funciones de API
import {
  getTodasLasClases,
  eliminarClase,
  getMaterias,
  getProfesores
} from "../../api/api";

const ClasesAdmin = () => {
  const navigate = useNavigate();
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    anio: "",
    division: "",
    materia: "",
    profesor: "",
    diaSemana: ""
  });

  // Estados para los selectores
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const anios = [1, 2, 3, 4, 5, 6];
  const divisiones = ["A", "B", "C", "D", "E"];

  // Cargar materias y profesores para los filtros
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resMaterias, resProfesores] = await Promise.all([
          getMaterias(),
          getProfesores()
        ]);
        setMaterias(resMaterias.data || []);
        setProfesores(resProfesores.data || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    cargarDatos();
  }, []);

  // Cargar clases con filtros
  useEffect(() => {
    cargarClases();
  }, [filtros]);

  const cargarClases = async () => {
    setLoading(true);
    try {
      // Construir objeto de filtros solo con valores definidos
      const filtrosLimpios = {};
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          filtrosLimpios[key] = filtros[key];
        }
      });

      const res = await getTodasLasClases(filtrosLimpios);
      setClases(res.data?.clases || []);
    } catch (err) {
      console.error("Error cargando clases:", err);
      toast.error(err.response?.data?.msg || "Error al cargar las clases");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta clase? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await eliminarClase(id);
      toast.success("Clase eliminada correctamente");
      cargarClases();
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error(err.response?.data?.msg || "Error al eliminar la clase");
    }
  };

  const handleGestionarAlumnos = (claseId) => {
    // CORRECCIÓN CRÍTICA: Validar que el ID existe antes de navegar
    if (!claseId || claseId === 'undefined') {
      toast.error("ID de clase inválido");
      console.error("ID de clase inválido:", claseId);
      return;
    }
    
    console.log("Navegando a gestión de alumnos con ID:", claseId);
    navigate(`/admin/clases/${claseId}/alumnos`);
  };

  const limpiarFiltros = () => {
    setFiltros({
      anio: "",
      division: "",
      materia: "",
      profesor: "",
      diaSemana: ""
    });
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v !== "");

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clases</h1>
        </div>
        <button
          onClick={() => navigate("/admin/clases/crear")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nueva Clase
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filtros.anio}
            onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todos los años</option>
            {anios.map(a => (
              <option key={a} value={a}>{a}° Año</option>
            ))}
          </select>

          <select
            value={filtros.division}
            onChange={(e) => setFiltros({ ...filtros, division: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todas las divisiones</option>
            {divisiones.map(d => (
              <option key={d} value={d}>División {d}</option>
            ))}
          </select>

          <select
            value={filtros.materia}
            onChange={(e) => setFiltros({ ...filtros, materia: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todas las materias</option>
            {materias.map(m => (
              <option key={m._id} value={m._id}>{m.nombre}</option>
            ))}
          </select>

          <select
            value={filtros.profesor}
            onChange={(e) => setFiltros({ ...filtros, profesor: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todos los profesores</option>
            {profesores.map(p => (
              <option key={p._id} value={p._id}>{p.nombre}</option>
            ))}
          </select>

          <select
            value={filtros.diaSemana}
            onChange={(e) => setFiltros({ ...filtros, diaSemana: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todos los días</option>
            {diasSemana.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Clases */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando clases...</span>
        </div>
      ) : clases.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No se encontraron clases
          </h3>
          <p className="text-gray-600">
            {hayFiltrosActivos
              ? "No hay clases que coincidan con los filtros seleccionados"
              : "Aún no hay clases creadas. Crea la primera clase para comenzar."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clases.map((clase) => (
            <div
              key={clase._id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      {clase.materia?.nombre || "Sin materia"}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {clase.anio}° {clase.division}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{clase.diaSemana}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{clase.horaInicio} - {clase.horaFin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>
                        {clase.profesores && clase.profesores.length > 0
                          ? clase.profesores.map(p => p.nombre).join(", ")
                          : "Sin profesor"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{clase.alumnos?.length || 0} alumnos</span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleGestionarAlumnos(clase._id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Gestionar alumnos"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/clases/${clase._id}/editar`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Editar clase"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEliminar(clase._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Eliminar clase"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      {!loading && clases.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Mostrando {clases.length} clase{clases.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default ClasesAdmin;