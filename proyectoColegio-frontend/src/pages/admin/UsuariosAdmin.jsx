import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  User, Mail, Shield, Edit3, Trash2, X, Plus, Users, Loader2, AlertCircle, Save, Hash, ListChecks, Search
} from "lucide-react";

// 1. Importamos las funciones corregidas
import { 
  getUsuarios, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario 
} from "../../api/api";

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  // Estado inicial del formulario
  const initialForm = {
      nombre: "", email: "", rol: "alumno", dni: "",
      anio: "", division: "", isActive: true
  };
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const aniosAcademicos = [1, 2, 3, 4, 5, 6];
  const rolesDisponibles = ["alumno", "profesor", "admin"];

  // --- Carga de Usuarios ---
  const fetchUsuarios = async () => {
     try {
       setLoading(true);
       const res = await getUsuarios();
       setUsuarios(res.data || []);
     } catch (error) {
       console.error("Error cargando usuarios:", error);
       setUsuarios([]);
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // --- Reset y Modales ---
  const resetForm = () => {
     setForm(initialForm);
     setEditandoId(null);
  };

  const abrirModalCrear = () => {
     resetForm();
     setShowModal(true);
  };

  const abrirModalEditar = (usuario) => {
    setEditandoId(usuario._id);
    setForm({
        nombre: usuario.nombre || "",
        email: usuario.email || "",
        rol: usuario.rol || "alumno",
        dni: usuario.dni || "",
        anio: usuario.anio || "",
        division: usuario.division || "",
        isActive: usuario.isActive !== undefined ? usuario.isActive : true
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- GUARDAR (Crear o Editar) ---
  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoadingAction(true);

    // Preparamos el payload limpiando datos innecesarios
    const payload = {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        dni: form.dni,
        isActive: form.isActive,
    };

    // Solo enviamos año/división si es alumno, para evitar error de validación del backend
    if (form.rol === 'alumno') {
        payload.anio = Number(form.anio); // Asegurar que sea número
        payload.division = form.division?.toUpperCase();
    }

    try {
      if (editandoId) {
        // Editar
        await actualizarUsuario(editandoId, payload);
        Swal.fire("¡Actualizado!", "El usuario ha sido modificado.", "success");
      } else {
        // Crear (Usa la ruta /admin/crear)
        await crearUsuario(payload);
        Swal.fire("¡Creado!", `Usuario creado. DNI: ${form.dni}`, "success");
      }
      
      setShowModal(false);
      fetchUsuarios(); // Recargar lista
      resetForm();

    } catch (error) {
      console.error("Error al guardar:", error);
      
      // Manejo de errores específico de Axios
      let msg = "Ocurrió un error al guardar.";
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        if (error.response.status === 404) msg = "Ruta no encontrada en el servidor (404).";
        else if (error.response.status === 400) msg = error.response.data.msg || "Datos inválidos (400).";
        else if (error.response.status === 401) msg = "No autorizado. Revisa tu sesión.";
        else msg = error.response.data.msg || "Error del servidor.";
      } else if (error.request) {
        msg = "No se recibió respuesta del servidor. Verifica tu conexión.";
      }

      Swal.fire("Error", msg, "error");
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Eliminar ---
  const handleDelete = async (id) => {
     const result = await Swal.fire({
       title: "¿Estás seguro?",
       text: "Esta acción eliminará al usuario permanentemente.",
       icon: "warning",
       showCancelButton: true,
       confirmButtonColor: "#d33",
       cancelButtonColor: "#3085d6",
       confirmButtonText: "Sí, eliminar"
     });

     if (result.isConfirmed) {
         try {
             await eliminarUsuario(id);
             Swal.fire("Eliminado", "El usuario ha sido eliminado.", "success");
             fetchUsuarios();
         } catch (error) {
             console.error(error);
             Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
         }
     }
  };

  // --- Filtrado ---
  const getRolStyle = (rol) => {
    switch (rol) {
      case "admin": return "bg-red-100 text-red-700";
      case "profesor": return "bg-indigo-100 text-indigo-700";
      case "alumno": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchRol = filterRole === "all" || u.rol === filterRole;
    const matchSearch = 
        u.nombre?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term) || 
        u.dni?.includes(term);
    return matchRol && matchSearch;
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="text-indigo-600" /> Gestión de Usuarios
                </h1>
                <p className="text-gray-500 text-sm">Administra alumnos, profesores y administradores.</p>
            </div>
            <button onClick={abrirModalCrear} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition">
                <Plus size={18} /> Nuevo Usuario
            </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)}
                className="p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="all">Todos los roles</option>
                {rolesDisponibles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">DNI</th>
                                <th className="px-6 py-3">Rol</th>
                                <th className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {usuariosFiltrados.length > 0 ? (
                                usuariosFiltrados.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{u.nombre}</td>
                                        <td className="px-6 py-3">{u.email}</td>
                                        <td className="px-6 py-3">{u.dni}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getRolStyle(u.rol)}`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center flex justify-center gap-2">
                                            <button onClick={() => abrirModalEditar(u)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Edit3 size={16}/></button>
                                            <button onClick={() => handleDelete(u._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        No se encontraron resultados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800">{editandoId ? "Editar Usuario" : "Nuevo Usuario"}</h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleGuardar} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input name="nombre" value={form.nombre} onChange={handleInputChange} className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="Ej: Juan Pérez" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input type="email" name="email" value={form.email} onChange={handleInputChange} className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="juan@email.com" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input name="dni" value={form.dni} onChange={handleInputChange} className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="12345678" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <select name="rol" value={form.rol} onChange={handleInputChange} className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none capitalize">
                                        {rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {form.rol === 'alumno' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                    <select name="anio" value={form.anio} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-white">
                                        <option value="">Seleccionar</option>
                                        {aniosAcademicos.map(a => <option key={a} value={a}>{a}°</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">División</label>
                                    <div className="relative">
                                        <ListChecks className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input name="division" value={form.division} onChange={handleInputChange} maxLength={1} className="w-full pl-9 p-2 border rounded-lg bg-white uppercase" placeholder="A" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {editandoId && (
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                <label htmlFor="isActive" className="text-sm text-gray-700">Usuario Activo</label>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                            <button type="submit" disabled={loadingAction} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 transition">
                                {loadingAction ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {editandoId ? "Guardar Cambios" : "Crear Usuario"}
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