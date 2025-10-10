import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Book,
  Calendar,
  User,
  LayoutGrid,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const MateriasAdmin = () => {
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState({ nombre: "", anio: "", profesor: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const token = localStorage.getItem("token");

  const fetchMaterias = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/materias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterias(res.data);
    } catch (error) {
      toast.error("Error al obtener materias");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesores = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfesores(res.data.filter((u) => u.rol === "profesor"));
    } catch {
      toast.error("Error al obtener profesores");
    }
  };

  const handleDelete = async (id) => {
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

    try {
      await axios.delete(`http://localhost:5000/api/materias/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Materia eliminada correctamente");
      fetchMaterias();
    } catch {
      toast.error("Error al eliminar materia");
    }
  };

  const handleGuardar = async () => {
    setLoadingAction(true);
    const url = modoEdicion
      ? `http://localhost:5000/api/materias/${editandoId}`
      : "http://localhost:5000/api/materias";
    const method = modoEdicion ? "put" : "post";

    try {
      await axios[method](url, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(modoEdicion ? "Materia actualizada" : "Materia creada");
      setShowModal(false);
      setForm({ nombre: "", anio: "", profesor: "" });
      setModoEdicion(false);
      setEditandoId(null);
      fetchMaterias();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Error al guardar materia";
      toast.error(errorMessage);
    } finally {
      setLoadingAction(false);
    }
  };

  const abrirModalEditar = (materia) => {
    setModoEdicion(true);
    setEditandoId(materia._id);
    setForm({
      nombre: materia.nombre,
      anio: materia.anio,
      profesor: materia.profesor?._id || "",
    });
    setShowModal(true);
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setForm({ nombre: "", anio: "", profesor: "" });
    setShowModal(true);
  };

  useEffect(() => {
    fetchMaterias();
    fetchProfesores();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
              <Book size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">
                Gestión de Materias
              </h1>
              <p className="text-xl text-gray-600">
                Crea, edita y elimina materias de la plataforma.
              </p>
            </div>
          </div>
          <button
            onClick={abrirModalNuevo}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Materia
          </button>
        </div>

        {/* TABLA O ESTADOS */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="animate-spin text-4xl text-blue-500 mb-4" />
              <p className="text-lg text-gray-700">Cargando materias...</p>
            </div>
          ) : materias.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <AlertCircle size={48} className="text-gray-400 mb-4" />
              <p className="text-lg font-semibold">No hay materias registradas.</p>
              <p className="mt-2">Haz clic en "Nueva Materia" para agregar una.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2"><LayoutGrid size={16} /> Nombre</div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2"><Calendar size={16} /> Año</div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2"><User size={16} /> Profesor</div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materias.map((materia) => (
                    <tr key={materia._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {materia.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {materia.anio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {materia.profesor?.nombre || "Sin asignar"} {materia.profesor?.apellido || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Editar materia"
                            onClick={() => abrirModalEditar(materia)}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar materia"
                            onClick={() => handleDelete(materia._id)}
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

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                <LayoutGrid size={28} className="inline-block mr-3 text-blue-600" />
                {modoEdicion ? "Editar Materia" : "Nueva Materia"}
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={form.anio}
                    onChange={(e) => setForm({ ...form, anio: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profesor asignado
                  </label>
                  <select
                    value={form.profesor}
                    onChange={(e) => setForm({ ...form, profesor: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors"
                    required
                  >
                    <option value="">-- Selecciona un profesor --</option>
                    {profesores.map((prof) => (
                      <option key={prof._id} value={prof._id}>
                        {prof.nombre} {prof.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors"
                  disabled={loadingAction}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    modoEdicion ? "Guardar Cambios" : "Crear Materia"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MateriasAdmin;