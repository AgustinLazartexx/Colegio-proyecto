import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const CrearClase = () => {
  const { token, user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    materia: "",
    profesor: "",
    anio: "", // Ahora será el año de cursada (1-6)
    diaSemana: "Lunes",
    horaInicio: "",
    horaFin: ""
  });

  // Opciones de años de cursada
  const aniosCursada = [
    { value: 1, label: "1° Año" },
    { value: 2, label: "2° Año" },
    { value: 3, label: "3° Año" },
    { value: 4, label: "4° Año" },
    { value: 5, label: "5° Año" },
    { value: 6, label: "6° Año" }
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Obtener materias
        const materiasRes = await axios.get("http://localhost:5000/api/materias", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMaterias(materiasRes.data);

        // Obtener usuarios y filtrar profesores
        const usuariosRes = await axios.get("http://localhost:5000/api/usuarios", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const profesoresFiltrados = usuariosRes.data.filter((u) => u.rol === "profesor");
        setProfesores(profesoresFiltrados);

      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar datos iniciales");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      cargarDatos();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    // Validaciones del frontend
    if (!form.materia || !form.profesor || !form.anio || !form.horaInicio || !form.horaFin) {
      setError("Todos los campos son obligatorios");
      setLoading(false);
      return;
    }

    if (form.horaInicio >= form.horaFin) {
      setError("La hora de inicio debe ser anterior a la hora de finalización");
      setLoading(false);
      return;
    }

    // Validar que el año esté en el rango correcto
    if (form.anio < 1 || form.anio > 6) {
      setError("El año de cursada debe estar entre 1° y 6° año");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/clases", form, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Mostrar éxito
      setSuccess(true);
      
      // Resetear formulario
      setForm({ 
        materia: "", 
        profesor: "", 
        anio: "", 
        diaSemana: "Lunes", 
        horaInicio: "", 
        horaFin: "" 
      });

      // Auto-ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Error:", error);
      
      if (error.response?.data?.msg) {
        setError(error.response.data.msg);
      } else if (error.response?.data?.errores) {
        setError(error.response.data.errores.join(", "));
      } else {
        setError("Error al crear la clase. Verifique su conexión e intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setError("");
    setSuccess(false);
  };

  if (loading && materias.length === 0 && profesores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Cargando datos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-gray-900 mb-2">Nueva Clase</h1>
          <div className="w-12 h-px bg-blue-600 mx-auto"></div>
        </div>

        {/* Alerta de éxito */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Clase creada exitosamente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning para usuarios no admin */}
        {user && user.rol !== 'admin' && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-amber-800">
                  Permisos insuficientes. Solo administradores pueden crear clases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-5">
            {/* Materia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia
              </label>
              <select 
                value={form.materia} 
                onChange={(e) => handleInputChange("materia", e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                disabled={loading}
              >
                <option value="" className="text-gray-500">Seleccionar materia</option>
                {materias.map(m => (
                  <option key={m._id} value={m._id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            {/* Profesor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profesor
              </label>
              <select 
                value={form.profesor} 
                onChange={(e) => handleInputChange("profesor", e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                disabled={loading}
              >
                <option value="" className="text-gray-500">Seleccionar profesor</option>
                {profesores.map(p => (
                  <option key={p._id} value={p._id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* Año de cursada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año de Cursada
              </label>
              <select 
                value={form.anio} 
                onChange={(e) => handleInputChange("anio", e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                disabled={loading}
              >
                <option value="" className="text-gray-500">Seleccionar año</option>
                {aniosCursada.map(anio => (
                  <option key={anio.value} value={anio.value}>{anio.label}</option>
                ))}
              </select>
            </div>

            {/* Día de la semana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Día de la Semana
              </label>
              <select 
                value={form.diaSemana} 
                onChange={(e) => handleInputChange("diaSemana", e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                disabled={loading}
              >
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(dia => (
                  <option key={dia} value={dia}>{dia}</option>
                ))}
              </select>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Inicio
                </label>
                <input 
                  type="time" 
                  value={form.horaInicio} 
                  onChange={(e) => handleInputChange("horaInicio", e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Fin
                </label>
                <input 
                  type="time" 
                  value={form.horaFin} 
                  onChange={(e) => handleInputChange("horaFin", e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Vista previa de la clase (opcional) */}
            {form.materia && form.anio && form.diaSemana && form.horaInicio && form.horaFin && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Vista previa de la clase:</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Materia:</strong> {materias.find(m => m._id === form.materia)?.nombre || 'N/A'}</p>
                  <p><strong>Profesor:</strong> {profesores.find(p => p._id === form.profesor)?.nombre || 'N/A'}</p>
                  <p><strong>Año:</strong> {form.anio}° año</p>
                  <p><strong>Día:</strong> {form.diaSemana}</p>
                  <p><strong>Horario:</strong> {form.horaInicio} - {form.horaFin}</p>
                </div>
              </div>
            )}

            {/* Botón de envío */}
            <button 
              onClick={handleSubmit}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </div>
              ) : (
                "Crear Clase"
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {materias.length} materias • {profesores.length} profesores disponibles
          </p>
          {user && (
            <p className="text-xs text-gray-400 mt-1">
              Conectado como {user.nombre} ({user.rol})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrearClase;