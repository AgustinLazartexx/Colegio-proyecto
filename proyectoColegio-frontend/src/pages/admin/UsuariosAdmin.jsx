import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../api/api"; // Ajusta la ruta según tu proyecto
import {
  User,
  Mail,
  Shield,
  Edit3,
  Trash2,
  X,
  Plus,
  Users,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: "", email: "", rol: "" });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // 'all', 'admin', 'profesor', 'alumno'

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los usuarios. Revisa la conexión con el servidor.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

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
      await api.delete(`/usuarios/${id}`);
      setUsuarios((prev) => prev.filter((u) => u._id !== id));
      Swal.fire({
        title: "¡Eliminado!",
        text: "El usuario ha sido eliminado con éxito.",
        icon: "success",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el usuario.",
        icon: "error",
      });
    }
  };

  const abrirModalEditar = (usuario) => {
    setEditando(usuario._id);
    setForm({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await api.put(`/usuarios/${editando}`, form);
      setShowModal(false);
      fetchUsuarios();
      Swal.fire({
        title: "¡Actualizado!",
        text: "El usuario se ha modificado con éxito.",
        icon: "success",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo modificar el usuario.",
        icon: "error",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Función para determinar el estilo del rol
  const getRolStyle = (rol) => {
    switch (rol) {
      case "admin":
        return "bg-red-100 text-red-700 font-semibold";
      case "profesor":
        return "bg-indigo-100 text-indigo-700 font-semibold";
      case "alumno":
        return "bg-green-100 text-green-700 font-semibold";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Lógica de filtrado y búsqueda
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const matchesRole = filterRole === "all" || usuario.rol === filterRole;

    const matchesSearchTerm =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRole && matchesSearchTerm;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado y Controles de Filtrado */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                <Users size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">
                  Gestión de Usuarios
                </h1>
                <p className="text-xl text-gray-600">
                  Administra los usuarios de la plataforma
                </p>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2">
              <Plus size={20} />
              Nuevo Usuario
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            {/* Input de Búsqueda */}
            <div className="relative w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {/* Selector de Rol */}
            <div className="w-full sm:w-1/4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-colors shadow-sm"
              >
                <option value="all">Todos los Roles</option>
                <option value="admin">Admin</option>
                <option value="profesor">Profesor</option>
                <option value="alumno">Alumno</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="animate-spin text-4xl text-blue-500 mb-4" />
              <p className="text-lg text-gray-700">Cargando usuarios...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <AlertCircle size={48} className="text-gray-400 mb-4" />
              <p className="text-lg font-semibold">
                No hay usuarios que coincidan con la búsqueda o el filtro.
              </p>
              <p className="mt-2">
                Intenta con otros términos o cambia el rol seleccionado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <User size={16} /> Nombre
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Mail size={16} /> Email
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Shield size={16} /> Rol
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {usuario.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs capitalize ${getRolStyle(
                            usuario.rol
                          )}`}
                        >
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => abrirModalEditar(usuario)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(usuario._id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar usuario"
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

        {/* MODAL DE EDICIÓN */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                <Edit3
                  size={28}
                  className="inline-block mr-3 text-indigo-600"
                />
                Editar Usuario
              </h3>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-colors"
                    required
                  >
                    <option value="alumno">Alumno</option>
                    <option value="profesor">Profesor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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

export default UsuariosAdmin;