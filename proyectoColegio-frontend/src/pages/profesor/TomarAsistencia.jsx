// src/pages/profesor/TomarAsistencia.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { CalendarCheck, UserCheck, Save } from "lucide-react";

const TomarAsistencia = () => {
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(false);

  const { usuario } = useAuth();
  const token = localStorage.getItem("token");

  // Traer materias
  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/materias/profesor/materias", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterias(res.data);
      } catch (err) {
        toast.error("Error al cargar materias");
      }
    };
    fetchMaterias();
  }, []);

  // Traer alumnos por materia
  const handleMateriaChange = async (e) => {
    const id = e.target.value;
    setMateriaSeleccionada(id);
    setAsistencias({});
    if (!id) return;

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/materias/${id}/alumnos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlumnos(res.data);
      
      // Inicializar asistencias con todos los alumnos como "ausente" por defecto
      const asistenciasIniciales = {};
      res.data.forEach(alumno => {
        asistenciasIniciales[alumno._id] = "ausente";
      });
      setAsistencias(asistenciasIniciales);
      
    } catch (err) {
      toast.error("Error al obtener alumnos");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios de asistencia con estados completos
  const cambiarEstadoAsistencia = (alumnoId, estado) => {
    setAsistencias((prev) => ({ 
      ...prev, 
      [alumnoId]: estado 
}));
};
 // Guardar asistencia - MODIFICADO Y CORRECTO
  const guardarAsistencia = async () => {
    if (!materiaSeleccionada) {
      toast.error("Selecciona una materia");
      return;
    }

    if (Object.keys(asistencias).length === 0) {
      toast.error("No hay asistencias para guardar");
      return;
    }

    setLoading(true);
    try {
      // Convertir el objeto de asistencias a array para el endpoint /tomar
      const asistenciasArray = Object.entries(asistencias).map(([alumnoId, estado]) => ({
        alumno: alumnoId,
        estado: estado
      }));

      // ----- PAYLOAD CORREGIDO -----
      // El nombre del campo "materia" ahora coincide con el backend ajustado
      const payload = {
        materia: materiaSeleccionada,
        fecha: new Date().toISOString().split('T')[0], // Fecha de hoy
        asistencias: asistenciasArray
      };

      console.log("Enviando payload:", payload); // Para debug

      await axios.post(
        "http://localhost:5000/api/asistencias/tomar",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Asistencia registrada correctamente");
      
    } catch (err) {
      console.error("Error detallado:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.msg || "Error al guardar asistencia";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <CalendarCheck /> Tomar Asistencia
      </h1>

      {/* Selector de materia */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Selecciona una materia:
        </label>
        <select
          value={materiaSeleccionada}
          onChange={handleMateriaChange}
          className="w-full p-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        >
          <option value="">Selecciona una materia...</option>
          {materias.map((m) => (
            <option key={m._id} value={m._id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de alumnos */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      ) : alumnos.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            Lista de Alumnos ({alumnos.length})
          </h2>
          
          {alumnos.map((alumno) => (
            <div key={alumno._id} className="flex items-center justify-between border p-4 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <UserCheck className="text-blue-500" />
                <div>
                  <span className="font-medium">{alumno.nombre}</span>
                  <p className="text-sm text-gray-500">{alumno.email}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {["presente", "ausente", "tarde", "justificado"].map((estado) => (
                  <label key={estado} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`asistencia-${alumno._id}`}
                      value={estado}
                      checked={asistencias[alumno._id] === estado}
                      onChange={() => cambiarEstadoAsistencia(alumno._id, estado)}
                      className="text-blue-600"
                    />
                    <span className={`text-sm capitalize ${
                      estado === "presente" ? "text-green-600" :
                      estado === "ausente" ? "text-red-600" :
                      estado === "tarde" ? "text-yellow-600" :
                      "text-blue-600"
                    }`}>
                      {estado}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end pt-4">
            <button
              onClick={guardarAsistencia}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={20} />
              {loading ? "Guardando..." : "Guardar Asistencia"}
            </button>
          </div>
        </div>
      ) : materiaSeleccionada ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay alumnos inscriptos en esta materia.</p>
        </div>
      ) : null}
    </div>
  );
};

export default TomarAsistencia;