import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Save,
  GraduationCap,
  Plus,
} from "lucide-react";
import Swal from "sweetalert2";

const ClasesAdmin = () => {
  const { token } = useAuth();
  const [clases, setClases] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    materia: "",
    profesor: "",
    anio: "",
    diaSemana: "",
    horaInicio: "",
    horaFin: ""
  });
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ anio: "", diaSemana: "" });

  const API_URL = "http://localhost:5000/api/clases";
  const AUX_DATA_URLS = {
    materias: "http://localhost:5000/api/materias",
    usuarios: "http://localhost:5000/api/usuarios"
  };

  useEffect(() => {
    fetchClases();
    fetchAuxiliaryData();
  }, [filter, token]);

  const fetchClases = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter,
      });
      setClases(res.data.clases || []);
    } catch (err) {
      console.error("Error al cargar las clases:", err);
      Swal.fire("Error", "No se pudieron cargar las clases.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [resMaterias, resUsuarios] = await Promise.all([
        axios.get(AUX_DATA_URLS.materias, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(AUX_DATA_URLS.usuarios, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMaterias(resMaterias.data || []);
      const soloProfesores = (resUsuarios.data || []).filter(u => u.rol === "profesor");
      setProfesores(soloProfesores);
    } catch (err) {
      console.error("Error al cargar datos auxiliares:", err);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      materia: "",
      profesor: "",
      anio: "",
      diaSemana: "",
      horaInicio: "",
      horaFin: ""
    });
    setEditingId(null);
    setShowModal(false);
  };

  const abrirModalEditar = (clase) => {
    setEditingId(clase.id);
    setForm({
      materia: clase.materia?._id || "",
      profesor: clase.profesor?._id || "",
      anio: clase.anio || "",
      diaSemana: clase.diaSemana || "",
      horaInicio: clase.horario.split(' - ')[0] || "",
      horaFin: clase.horario.split(' - ')[1] || ""
    });
    setShowModal(true);
  };

  const abrirModalCrear = () => {
    resetForm();
    setShowModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("¡Actualizado!", "La clase ha sido modificada con éxito.", "success");
      } else {
        await axios.post(API_URL, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("¡Creado!", "La nueva clase ha sido registrada.", "success");
      }
      resetForm();
      fetchClases();
    } catch (err) {
      const msg = err.response?.data?.msg || "Hubo un error al guardar la clase.";
      console.error("Error al guardar clase:", err.response?.data);
      Swal.fire("Error", msg, "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClases((prev) => prev.filter((c) => c.id !== id));
      Swal.fire("¡Eliminado!", "La clase ha sido eliminada con éxito.", "success");
    } catch (err) {
      const msg = err.response?.data?.msg || "Error al eliminar la clase.";
      console.error("Error al eliminar clase:", err.response?.data);
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const aniosCursada = [1, 2, 3, 4, 5, 6];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado y filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">Gestión de Clases</h1>
              <p className="text-xl text-gray-600">Administra las clases de la plataforma</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              name="anio"
              value={filter.anio}
              onChange={handleFilterChange}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors w-full sm:w-auto"
            >
              <option value="">Filtrar por Año</option>
              {aniosCursada.map((anio) => (
                <option key={anio} value={anio}>{anio}° Año</option>
              ))}
            </select>
            <select
              name="diaSemana"
              value={filter.diaSemana}
              onChange={handleFilterChange}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors w-full sm:w-auto"
            >
              <option value="">Filtrar por Día</option>
              {diasSemana.map((dia) => (
                <option key={dia} value={dia}>{dia}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de Clases */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="animate-spin text-4xl text-blue-500 mb-4" />
              <p className="text-lg text-gray-700">Cargando clases...</p>
            </div>
          ) : clases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <AlertCircle size={48} className="text-gray-400 mb-4" />
              <p className="text-lg font-semibold">No hay clases registradas.</p>
              <p className="mt-2">Puedes crear una nueva con el botón de arriba.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Materia
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Profesor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Año
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Día
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clases.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.materia?.nombre || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {c.profesor?.nombre || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {c.anio ? `${c.anio}° Año` : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {c.diaSemana || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {c.horario || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => abrirModalEditar(c)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Editar clase"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminar(c.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar clase"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL DE EDICIÓN / CREACIÓN */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
              <button
                onClick={resetForm}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {editingId ? "Editar Clase" : "Crear Nueva Clase"}
              </h3>
              <form onSubmit={handleGuardar} className="grid gap-4">
                <select
                  name="materia"
                  value={form.materia}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">Seleccionar Materia</option>
                  {materias.map((m) => (
                    <option key={m._id} value={m._id}>{m.nombre}</option>
                  ))}
                </select>
                <select
                  name="profesor"
                  value={form.profesor}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">Seleccionar Profesor</option>
                  {profesores.map((p) => (
                    <option key={p._id} value={p._id}>{p.nombre}</option>
                  ))}
                </select>
                <select
                  name="anio"
                  value={form.anio}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">Seleccionar Año de Cursada</option>
                  {aniosCursada.map((anio) => (
                    <option key={anio} value={anio}>{anio}° Año</option>
                  ))}
                </select>
                <select
                  name="diaSemana"
                  value={form.diaSemana}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">Día</option>
                  {diasSemana.map((dia) => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
                <input
                  type="time"
                  name="horaInicio"
                  value={form.horaInicio}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                />
                <input
                  type="time"
                  name="horaFin"
                  value={form.horaFin}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                />

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors"
                    disabled={loadingAction}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loadingAction}
                  >
                    {loadingAction ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClasesAdmin;