// src/pages/admin/UsuariosAdmin.jsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
// Asumiendo que 'api' es tu instancia configurada de Axios
import api from "../../api/api";
import {
  User, Mail, Shield, Edit3, Trash2, X, Plus, Users, Loader2, AlertCircle, Save, Hash, Calendar, ListChecks,
  Search
} from "lucide-react";

// Helper para manejar select múltiple (si lo necesitas en el futuro)
const getSelectedOptions = (options) => {
  const selectedValues = [];
  for (let i = 0, l = options.length; i < l; i++) {
    if (options[i].selected) {
      selectedValues.push(options[i].value);
    }
  }
  return selectedValues;
};

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
      nombre: "",
      email: "",
      rol: "alumno",
      dni: "",
      anio: "",
      division: "",
      isActive: true
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const aniosAcademicos = [1, 2, 3, 4, 5, 6];
  const rolesDisponibles = ["alumno", "profesor", "admin"];

  const fetchUsuarios = async () => {
     try {
       setLoading(true);
       const res = await api.get("/usuarios"); // Usa GET /usuarios
       setUsuarios(res.data || []); // Asegurar que sea un array
     } catch (error) {
       console.error("Error al cargar usuarios:", error);
       Swal.fire("Error", "No se pudieron cargar los usuarios.", "error");
       setUsuarios([]); // Resetear a array vacío en caso de error
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
       text: "Considera deshabilitar al usuario en lugar de eliminarlo permanentemente.",
       icon: "warning",
       showCancelButton: true,
       showDenyButton: true, // Botón para deshabilitar
       confirmButtonColor: "#EF4444", // Rojo para eliminar
       denyButtonColor: '#fbbf24', // Amarillo/Naranja para deshabilitar
       cancelButtonColor: "#6B7280",
       confirmButtonText: "Sí, Eliminar",
       denyButtonText: "Deshabilitar Usuario",
       cancelButtonText: "Cancelar",
     });

     if (confirm.isDismissed) return; // Si cancela

     setLoadingAction(true); // Mostrar spinner mientras se procesa
     try {
         if (confirm.isConfirmed) {
             // Eliminar usuario
             await api.delete(`/usuarios/${id}`);
             Swal.fire("¡Eliminado!", "Usuario eliminado.", "success");
         } else if (confirm.isDenied) {
             // Deshabilitar usuario
             await api.put(`/usuarios/${id}`, { isActive: false });
             Swal.fire("¡Deshabilitado!", "Usuario deshabilitado.", "info");
         }
         fetchUsuarios(); // Refrescar la lista en ambos casos
     } catch (error) {
         Swal.fire("Error", `No se pudo ${confirm.isConfirmed ? 'eliminar' : 'deshabilitar'} el usuario.`, "error");
     } finally {
         setLoadingAction(false);
     }
  };

  const resetForm = () => {
     setForm({
         nombre: "", email: "", rol: "alumno", dni: "",
         anio: "", division: "", isActive: true
     });
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

  // --- FUNCIÓN handleInputChange AÑADIDA ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Manejar checkbox para isActive
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };
  // --- FIN FUNCIÓN ---

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoadingAction(true);

    let payload = {
        nombre: form.nombre, email: form.email, rol: form.rol,
        dni: form.dni, isActive: form.isActive,
    };
    if (form.rol === 'alumno') {
        payload.anio = form.anio;
        payload.division = form.division?.toUpperCase(); // Asegurar mayúsculas
    }

    // Limpiar campos no relevantes para el rol actual antes de enviar
     if (form.rol !== 'alumno') {
       payload.anio = undefined;
       payload.division = undefined;
     }


    try {
      let response;
      if (editandoId) {
        response = await api.put(`/usuarios/${editandoId}`, payload);
        Swal.fire("¡Actualizado!", "Usuario modificado.", "success");
      } else {
        response = await api.post(`/admin/crear`, payload);
        Swal.fire({
            title: "¡Usuario Creado!",
            html: `Se ha creado el usuario.<br/><b>Contraseña Inicial:</b> ${form.dni}<br/><small>(El usuario deberá cambiarla)</small>`,
            icon: "success"
        });
      }
      setShowModal(false);
      fetchUsuarios();
      resetForm();

    } catch (error) {
      const errorMsg = error.response?.data?.msg || `No se pudo ${editandoId ? 'modificar' : 'crear'} el usuario.`;
      console.error("Error guardando usuario:", error.response?.data || error);
      Swal.fire("Error", errorMsg, "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const getRolStyle = (rol) => {
    switch (rol) {
      case "admin": return "bg-red-100 text-red-700 font-semibold";
      case "profesor": return "bg-indigo-100 text-indigo-700 font-semibold";
      case "alumno": return "bg-green-100 text-green-700 font-semibold";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const term = searchTerm.toLowerCase();
    const matchesRole = filterRole === "all" || usuario.rol === filterRole;
    const matchesSearchTerm = !term ||
          usuario.nombre.toLowerCase().includes(term) ||
          usuario.email.toLowerCase().includes(term) ||
          (usuario.dni && usuario.dni.includes(term)) || // Buscar también por DNI
          (usuario.codigoAlumno && usuario.codigoAlumno.includes(term)); // Buscar por código

    return matchesRole && matchesSearchTerm;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado y Botón Crear */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600 text-white rounded-full shadow-md"> <Users size={28} /> </div>
             <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-lg text-gray-600">Administra los usuarios de la plataforma</p>
             </div>
           </div>
           <button onClick={abrirModalCrear} className="btn-primary w-full sm:w-auto">
             <Plus size={18} className="mr-2"/> Nuevo Usuario
           </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:flex-1"> {/* Buscador toma más espacio */}
               <input type="text" placeholder="Buscar por nombre, email, DNI o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style pl-10"/>
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="input-style w-full sm:w-auto">
               <option value="all">Todos los Roles</option>
               {rolesDisponibles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {loading ? (
             <div className="flex justify-center items-center p-12"> <Loader2 className="animate-spin text-3xl text-blue-500" /> </div>
          ) : usuariosFiltrados.length === 0 ? (
             <div className="text-center p-12 text-gray-500">
                <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="font-semibold">No hay usuarios que coincidan.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th-style"><User size={14} /> Nombre</th>
                    <th className="th-style"><Mail size={14} /> Email</th>
                    <th className="th-style"><Hash size={14} /> DNI</th>
                    <th className="th-style"><ListChecks size={14}/> Código Alumno</th>
                    <th className="th-style"><Shield size={14} /> Rol</th>
                    <th className="th-style text-center">Estado</th>
                    <th className="th-style text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario._id} className="hover:bg-gray-50">
                      <td className="td-style font-medium text-gray-900">{usuario.nombre}</td>
                      <td className="td-style text-gray-600">{usuario.email}</td>
                      <td className="td-style text-gray-600">{usuario.dni || "-"}</td>
                      <td className="td-style text-gray-600 text-center">{usuario.codigoAlumno || "-"}</td>
                      <td className="td-style">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs capitalize ${getRolStyle(usuario.rol)}`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="td-style text-center">
                         <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${usuario.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {usuario.isActive ? 'Activo' : 'Inactivo'}
                         </span>
                      </td>
                      <td className="td-style text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => abrirModalEditar(usuario)} className="text-indigo-600 hover:text-indigo-800" title="Editar"><Edit3 size={16} /></button>
                          {/* Modificado para que el botón muestre un icono diferente para deshabilitar/habilitar */}
                           <button
                             onClick={() => handleDelete(usuario._id)} // handleDelete ahora maneja deshabilitar/eliminar
                             className={`${usuario.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-red-600 hover:text-red-800'}`}
                             title={usuario.isActive ? 'Deshabilitar/Eliminar' : 'Eliminar Permanentemente'}
                           >
                               <Trash2 size={16} />
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

        {/* MODAL DE CREAR / EDICIÓN */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in-down">
              <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h3 className="text-xl font-semibold text-gray-900 mb-5 border-b pb-3 flex items-center gap-2">
                 {editandoId ? <Edit3 size={18} className="text-indigo-600"/> : <Plus size={18} className="text-blue-600"/>}
                 {editandoId ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h3>
              <form onSubmit={handleGuardar} className="space-y-4">
                 {/* Nombre */}
                 <div>
                    <label className="label-style">Nombre</label>
                    <input type="text" name="nombre" value={form.nombre} onChange={handleInputChange} required className="input-style"/>
                 </div>
                 {/* Email */}
                 <div>
                    <label className="label-style">Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleInputChange} required className="input-style"/>
                 </div>
                 {/* DNI */}
                 <div>
                    <label className="label-style">DNI {editandoId ? '' : '(Será la contraseña inicial)'}</label>
                    <input type="text" name="dni" value={form.dni} onChange={handleInputChange} required className="input-style"/>
                 </div>
                 {/* Rol */}
                 <div>
                    <label className="label-style">Rol</label>
                    <select name="rol" value={form.rol} onChange={handleInputChange} required className="input-style">
                      {rolesDisponibles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                 </div>

                 {/* CAMPOS CONDICIONALES PARA ALUMNO */}
                 {form.rol === 'alumno' && (
                     <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4 border-gray-200">
                        <div>
                           <label className="label-style">Año Cursada</label>
                           <select name="anio" value={form.anio} onChange={handleInputChange} required className="input-style">
                             <option value="">Seleccionar</option>
                             {aniosAcademicos.map(a => <option key={a} value={a}>{a}° Año</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="label-style">División</label>
                           <input type="text" name="division" value={form.division} onChange={handleInputChange} required maxLength={1} placeholder="Ej: A" className="input-style uppercase"/>
                        </div>
                     </div>
                 )}

                 {/* Estado Activo (solo visible en edición) */}
                 {editandoId && (
                     <div className="pt-4 border-t border-gray-200">
                         <label className="flex items-center gap-2 text-sm text-gray-700">
                             <input
                                 type="checkbox"
                                 name="isActive"
                                 checked={form.isActive}
                                 onChange={handleInputChange} // Usar el mismo handler
                                 className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                             Usuario Activo
                         </label>
                         <p className="text-xs text-gray-500 ml-6">Desmarca para deshabilitar el acceso del usuario.</p>
                     </div>
                 )}

                 {/* Botones */}
                 <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                   <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" disabled={loadingAction}>Cancelar</button>
                   <button type="submit" className="btn-primary" disabled={loadingAction}>
                     {loadingAction ? <Loader2 size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}
                     {loadingAction ? "Guardando..." : "Guardar Cambios"}
                   </button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Estilos */}
      <style jsx global>{`
         .input-style { @apply w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white; }
         .label-style { @apply block text-xs font-medium text-gray-600 mb-1; }
         .th-style { @apply px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap; }
         .td-style { @apply px-5 py-4 whitespace-nowrap text-sm; }
         .btn-primary { @apply inline-flex items-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors; }
         .btn-secondary { @apply inline-flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors; }
         @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
         .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default UsuariosAdmin;