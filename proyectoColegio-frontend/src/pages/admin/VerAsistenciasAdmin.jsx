import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  CalendarDays,
  Filter,
  UserCheck,
  Users,
  BookOpen,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

const VerAsistenciasAdmin = () => {
  const { token } = useAuth();
  const [asistencias, setAsistencias] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fecha: "",
    anio: "",
    division: "",
    materia: "",
  });

  // 🔹 Obtener todas las materias (para filtro)
  const fetchMaterias = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/materias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterias(res.data);
    } catch {
      toast.error("Error al cargar materias");
    }
  };

  // 🔹 Obtener asistencias con filtros
  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });

      const res = await axios.get(`http://localhost:5000/api/asistencias?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAsistencias(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error al cargar asistencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const limpiarFiltros = () => {
    setFiltros({
      fecha: "",
      anio: "",
      division: "",
      materia: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 🔷 Título */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-blue-600 rounded-full">
            <CalendarDays className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Asistencias
          </h1>
        </div>

        {/* 🔹 Filtros */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Año"
              value={filtros.anio}
              onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filtros.division}
              onChange={(e) => setFiltros({ ...filtros, division: e.target.value })}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">División</option>
              {["A", "B", "C"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={filtros.materia}
              onChange={(e) => setFiltros({ ...filtros, materia: e.target.value })}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Materia</option>
              {materias.map((m) => (
                <option key={m._id} value={m._id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
            >
              Limpiar
            </button>
            <button
              onClick={fetchAsistencias}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <SearchIcon />}
              Buscar
            </button>
          </div>
        </div>

        {/* 🔹 Resultados */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck className="text-blue-600" />
              Registros de Asistencia
            </h2>
            <button
              onClick={() => toast.info("Exportar a Excel próximamente")}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <FileSpreadsheet size={18} /> Exportar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : asistencias.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-blue-50 text-blue-900 font-semibold">
                    <th className="p-3 border-b">Fecha</th>
                    <th className="p-3 border-b">Alumno</th>
                    <th className="p-3 border-b">Materia</th>
                    <th className="p-3 border-b">Estado</th>
                    <th className="p-3 border-b">Cargado por</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50 transition">
                      <td className="p-3 border-b">{new Date(a.fecha).toLocaleDateString()}</td>
                      <td className="p-3 border-b">{a.alumno?.nombre || "—"}</td>
                      <td className="p-3 border-b">{a.materia?.nombre || "—"}</td>
                      <td className={`p-3 border-b font-medium capitalize ${
                        a.estado === "presente" ? "text-green-600" :
                        a.estado === "ausente" ? "text-red-600" :
                        a.estado === "tarde" ? "text-yellow-600" :
                        "text-blue-600"
                      }`}>
                        {a.estado}
                      </td>
                      <td className="p-3 border-b text-gray-600">
                        {a.cargadoPor?.nombre || "Admin"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              No se encontraron asistencias con los filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>;

export default VerAsistenciasAdmin;
