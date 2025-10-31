// src/pages/admin/UsuariosAdmin.jsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../api/api";
import {
  User, Mail, Shield, Edit3, Trash2, X, Plus, Users, Loader2, AlertCircle, Save, Hash, ListChecks,
  Search, Filter
} from "lucide-react";

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
      nombre: "", email: "", rol: "alumno", dni: "",
      anio: "", division: "", isActive: true
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const aniosAcademicos = [1, 2, 3, 4, 5, 6];
  const rolesDisponibles = ["alumno", "profesor", "admin"];

  // --- Funciones de Lógica (sin cambios) ---

  const fetchUsuarios = async () => {
     try {
       setLoading(true);
       const res = await api.get("/usuarios");
       setUsuarios(res.data || []);
     } catch (error) {
       console.error("Error al cargar usuarios:", error);
       Swal.fire("Error", "No se pudieron cargar los usuarios.", "error");
       setUsuarios([]);
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
       showDenyButton: true,
       confirmButtonColor: "#EF4444",
       denyButtonColor: '#fbbf24',
       cancelButtonColor: "#6B7280",
       confirmButtonText: "Sí, Eliminar",
       denyButtonText: "Deshabilitar",
       cancelButtonText: "Cancelar",
     });

     if (confirm.isDismissed) return;

     setLoadingAction(true);
     try {
         if (confirm.isConfirmed) {
             await api.delete(`/usuarios/${id}`);
             Swal.fire("¡Eliminado!", "Usuario eliminado.", "success");
         } else if (confirm.isDenied) {
             await api.put(`/usuarios/${id}`, { isActive: false });
             Swal.fire("¡Deshabilitado!", "Usuario deshabilitado.", "info");
         }
         fetchUsuarios();
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    let payload = {
        nombre: form.nombre, email: form.email, rol: form.rol,
        dni: form.dni, isActive: form.isActive,
    };
    if (form.rol === 'alumno') {
        payload.anio = form.anio;
        payload.division = form.division?.toUpperCase();
    } else {
       payload.anio = undefined;
       payload.division = undefined;
    }

    try {
      if (editandoId) {
        await api.put(`/usuarios/${editandoId}`, payload);
        Swal.fire("¡Actualizado!", "Usuario modificado.", "success");
      } else {
        await api.post(`/usuarios/admin/crear`, payload);
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
      case "admin": return "bg-red-100 text-red-700 font-medium";
      case "profesor": return "bg-indigo-100 text-indigo-700 font-medium";
      case "alumno": return "bg-green-100 text-green-700 font-medium";
      default: return "bg-gray-100 text-gray-700 font-medium";
    }
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const term = searchTerm.toLowerCase();
    const matchesRole = filterRole === "all" || usuario.rol === filterRole;
    const matchesSearchTerm = !term ||
          usuario.nombre.toLowerCase().includes(term) ||
          usuario.email.toLowerCase().includes(term) ||
          (usuario.dni && usuario.dni.includes(term)) ||
          (usuario.codigoAlumno && usuario.codigoAlumno.includes(term));
    return matchesRole && matchesSearchTerm;
  });

  // --- Renderizado con Estilos Profesionales ---
  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"> <Users size={24} /> </div>
             <div>
                <h1 className="text-2xl font-semibold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-sm text-gray-600">Administra los usuarios de la plataforma.</p>
             </div>
           </div>
           {/* --- Botón de Añadir Profesional --- */}
           <button 
             onClick={abrirModalCrear} 
             className="inline-flex items-center bg-indigo-600 text-white font-medium px-4 py-2 rounded-md text-sm shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 w-full sm:w-auto"
            >
             <Plus size={16} className="mr-1"/> Nuevo Usuario
           </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-grow w-full sm:w-auto">
               <input
                 type="text"
                 placeholder="Buscar por nombre, email, DNI o código..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pl-9"
               />
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full sm:w-48 border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
               <option value="all">Todos los Roles</option>
               {rolesDisponibles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
             <div className="flex justify-center items-center p-10 text-gray-500">
               <Loader2 className="animate-spin text-xl text-indigo-500 mr-2" /> Cargando...
             </div>
          ) : usuariosFiltrados.length === 0 ? (
             <div className="text-center p-10 text-gray-500">
                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="font-medium text-gray-700">No se encontraron usuarios</p>
                <p className="text-sm">Ajusta los filtros o crea un nuevo usuario.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"><div className="flex items-center gap-1.5"><User size={14} /> Nombre</div></th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"><div className="flex items-center gap-1.5"><Mail size={14} /> Email</div></th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"><div className="flex items-center gap-1.5"><Hash size={14} /> DNI</div></th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"><div className="inline-flex items-center gap-1.5"><ListChecks size={14}/> Código</div></th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"><div className="flex items-center gap-1.5"><Shield size={14} /> Rol</div></th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Estado</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{usuario.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{usuario.dni || <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{usuario.codigoAlumno || <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs capitalize ${getRolStyle(usuario.rol)}`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                         <span className={`px-2 py-0.5 rounded text-xs font-medium ${usuario.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {usuario.isActive ? 'Activo' : 'Inactivo'}
                         </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => abrirModalEditar(usuario)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50" title="Editar"><Edit3 size={15} /></button>
                          <button
                            onClick={() => handleDelete(usuario._id)}
                            className={`${usuario.isActive ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' : 'text-red-600 hover:text-red-800 hover:bg-red-50'} p-1 rounded`}
                            title={usuario.isActive ? 'Deshabilitar/Eliminar' : 'Eliminar'}
                          >
                             <Trash2 size={15} />
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

        {/* --- MODAL PROFESIONAL Y LEGIBLE --- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative animate-fade-in-down border border-gray-200">
              
              {/* Encabezado del Modal */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                   {editandoId ? <Edit3 size={18} className="text-indigo-600"/> : <Plus size={18} className="text-blue-600"/>}
                   <h3 className="text-xl font-semibold text-gray-800">
                     {editandoId ? "Editar Usuario" : "Crear Nuevo Usuario"}
                   </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                    <X size={20} />
                </button>
              </div>

              {/* Formulario del Modal */}
              <form onSubmit={handleGuardar} className="space-y-4 mt-5">
                 {/* Nombre */}
                 <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input type="text" id="nombre" name="nombre" value={form.nombre} onChange={handleInputChange} required className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 {/* Email */}
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="email" name="email" value={form.email} onChange={handleInputChange} required className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 {/* DNI */}
                 <div>
                    <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
                      DNI {editandoId ? '' : <span className="text-gray-500 font-normal">(Contraseña inicial)</span>}
                    </label>
                    <input type="text" id="dni" name="dni" value={form.dni} onChange={handleInputChange} required className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 {/* Rol */}
                 <div>
                    <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select id="rol" name="rol" value={form.rol} onChange={handleInputChange} required className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize">
                      {rolesDisponibles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                 </div>

                 {/* Campos Condicionales Alumno */}
                 {form.rol === 'alumno' && (
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                           <label htmlFor="anio" className="block text-sm font-medium text-gray-700 mb-1">Año Cursada</label>
                           <select id="anio" name="anio" value={form.anio} onChange={handleInputChange} required className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                             <option value="">Seleccionar</option>
                             {aniosAcademicos.map(a => <option key={a} value={a}>{a}° Año</option>)}
                           </select>
                        </div>
                        <div>
                           <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">División</label>
                           <input type="text" id="division" name="division" value={form.division} onChange={handleInputChange} required maxLength={1} placeholder="Ej: A" className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 uppercase"/>
                        </div>
                     </div>
                 )}

                 {/* Estado Activo (solo en edición) */}
                 {editandoId && (
                     <div className="pt-4 border-t border-gray-100">
                         <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                             <input
                                 type="checkbox" name="isActive" checked={form.isActive}
                                 onChange={handleInputChange}
                                 className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                             Usuario Activo
                         </label>
                         <p className="text-xs text-gray-500 ml-6">Desmarca para deshabilitar el acceso.</p>
                     </div>
                 )}

                 {/* Botones (estilo profesional) */}
                 <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-6">
                   <button 
                     type="button" 
                     onClick={() => setShowModal(false)} 
                     className="inline-flex items-center bg-white text-gray-700 font-medium px-4 py-2 rounded-md text-sm border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150" 
                     disabled={loadingAction}
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit" 
                     className="inline-flex items-center bg-indigo-600 text-white font-medium px-4 py-2 rounded-md text-sm shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150" 
                     disabled={loadingAction}
                   >
                     {loadingAction ? <Loader2 size={16} className="animate-spin mr-1.5"/> : <Save size={16} className="mr-1.5"/>}
                     {loadingAction ? "Guardando..." : "Guardar"}
                   </button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* --- ELIMINADO EL BLOQUE <style jsx global> --- */}
      {/* Los estilos ahora son clases puras de Tailwind */}
    </div>
  );
};

export default UsuariosAdmin;