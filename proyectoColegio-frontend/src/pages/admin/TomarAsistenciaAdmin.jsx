import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { CalendarCheck, UserCheck, Save, School } from "lucide-react";

const TomarAsistenciaAdmin = () => {
  const { token } = useAuth();
  const [anio, setAnio] = useState("");
  const [division, setDivision] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔹 Cargar alumnos por año y división
  const fetchAlumnos = async () => {
    if (!anio || !division) {
      toast.info("Selecciona año y división");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/alumnos?anio=${anio}&division=${division}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlumnos(res.data || []);

      const inicial = {};
      res.data.forEach((a) => {
        inicial[a._id] = "ausente";
      });
      setAsistencias(inicial);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar alumnos");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cambiar estado de asistencia
  const cambiarEstadoAsistencia = (alumnoId, estado) => {
    setAsistencias((prev) => ({
      ...prev,
      [alumnoId]: estado,
    }));
  };

  // 🔹 Guardar asistencia
  const guardarAsistencia = async () => {
    if (!anio || !division) {
      toast.error("Selecciona año y división");
      return;
    }

    if (Object.keys(asistencias).length === 0) {
      toast.error("No hay asistencias para guardar");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        anio,
        division,
        fecha: new Date().toISOString().split("T")[0],
        asistencias: Object.entries(asistencias).map(([alumno, estado]) => ({
          alumno,
          estado,
        })),
      };

      await axios.post("http://localhost:5000/api/asistencias/tomar", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Asistencia registrada correctamente 🎯");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-full">
            <CalendarCheck className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tomar Asistencia - Admin
          </h1>
        </div>

        {/* Selección de curso */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="number"
              min="1"
              max="7"
              placeholder="Año"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">División</option>
              {["A", "B", "C"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={fetchAlumnos}
              disabled={loading}
              className="bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 px-4 py-3 hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? (
                <span className="animate-pulse">Cargando...</span>
              ) : (
                <>
                  <School size={20} /> Cargar Alumnos
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lista de alumnos */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando alumnos...</p>
          </div>
        ) : alumnos.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <UserCheck className="text-blue-600" /> Lista de Alumnos ({alumnos.length})
            </h2>

            <div className="space-y-4">
              {alumnos.map((alumno) => (
                <div
                  key={alumno._id}
                  className="flex flex-col md:flex-row md:items-center justify-between border p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {alumno.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{alumno.nombre}</p>
                      <p className="text-gray-600 text-sm">{alumno.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-3 md:mt-0">
                    {["presente", "ausente", "tarde", "justificado"].map(
                      (estado) => (
                        <label
                          key={estado}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`asistencia-${alumno._id}`}
                            value={estado}
                            checked={asistencias[alumno._id] === estado}
                            onChange={() =>
                              cambiarEstadoAsistencia(alumno._id, estado)
                            }
                            className="text-blue-600"
                          />
                          <span
                            className={`text-sm capitalize font-medium ${
                              estado === "presente"
                                ? "text-green-600"
                                : estado === "ausente"
                                ? "text-red-600"
                                : estado === "tarde"
                                ? "text-yellow-600"
                                : "text-blue-600"
                            }`}
                          >
                            {estado}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end mt-6">
              <button
                onClick={guardarAsistencia}
                disabled={saving}
                className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition disabled:bg-gray-400"
              >
                <Save size={20} />
                {saving ? "Guardando..." : "Guardar Asistencia"}
              </button>
            </div>
          </div>
        ) : (
          anio &&
          division && (
            <div className="bg-white rounded-xl p-6 text-center text-gray-600 shadow-md">
              No hay alumnos registrados en {anio}° {division}.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TomarAsistenciaAdmin;
