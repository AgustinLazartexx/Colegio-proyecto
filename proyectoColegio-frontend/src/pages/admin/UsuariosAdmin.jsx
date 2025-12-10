import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  User, Mail, Shield, Edit3, Trash2, X, Plus, Users, Loader2, Save, Hash, ListChecks, Search, DollarSign, Filter, GraduationCap, Briefcase
} from "lucide-react";

import AdminGestionCuotas from "../../pages/admin/AdminGestionCuotas";

import { 
  getUsuarios, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario 
} from "../../api/api";

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE ORGANIZACIÓN ---
  const [activeTab, setActiveTab] = useState("alumno"); // 'alumno', 'profesor', 'admin'
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtros específicos para alumnos
  const [filterAnio, setFilterAnio] = useState("");
  const [filterDivision, setFilterDivision] = useState("");

  // --- ESTADOS DEL MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [alumnoSeleccionadoFinanzas, setAlumnoSeleccionadoFinanzas] = useState(null);

  // Formulario inicial
  const initialForm = {
      nombre: "", email: "", rol: "alumno", dni: "",
      anio: "", division: "", isActive: true
  };
  const [form, setForm] = useState(initialForm);

  const aniosAcademicos = [1, 2, 3, 4, 5, 6];

  // --- CARGA DE DATOS ---
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

  // --- LÓGICA DE FILTRADO (LA CLAVE DE LA ORGANIZACIÓN) ---
  const usuariosFiltrados = usuarios.filter((u) => {
    // 1. Primer filtro: Por Pestaña (Rol)
    if (u.rol !== activeTab) return false;

    // 2. Segundo filtro: Búsqueda de texto (Nombre, DNI, Email)
    const term = searchTerm.toLowerCase();
    const matchSearch = 
        u.nombre?.toLowerCase().includes(term) || 
        u.email?.toLowerCase().includes(term) || 
        u.dni?.includes(term);

    if (!matchSearch) return false;

    // 3. Tercer filtro: Específico para Alumnos (Año y División)
    if (activeTab === "alumno") {
        if (filterAnio && u.anio !== parseInt(filterAnio)) return false;
        if (filterDivision && u.division !== filterDivision) return false;
    }

    return true;
  });

  // --- MANEJO DEL MODAL ---
  const resetForm = () => {
      // Al crear, pre-seleccionamos el rol de la pestaña actual para agilizar
      setForm({ ...initialForm, rol: activeTab });
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

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoadingAction(true);

    const payload = {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        dni: form.dni,
        isActive: form.isActive,
    };

    if (form.rol === 'alumno') {
        payload.anio = Number(form.anio);
        payload.division = form.division?.toUpperCase();
    }

    try {
      if (editandoId) {
        await actualizarUsuario(editandoId, payload);
        Swal.fire("¡Actualizado!", "Usuario modificado correctamente.", "success");
      } else {
        await crearUsuario(payload);
        Swal.fire("¡Creado!", `Usuario creado con DNI: ${form.dni}`, "success");
      }
      setShowModal(false);
      fetchUsuarios();
      resetForm();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar los cambios.", "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id) => {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción es irreversible.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar"
      });

      if (result.isConfirmed) {
          try {
              await eliminarUsuario(id);
              Swal.fire("Eliminado", "Usuario eliminado.", "success");
              fetchUsuarios();
          } catch (error) {
              Swal.fire("Error", "No se pudo eliminar.", "error");
          }
      }
  };

  // --- RENDERIZADO DE PESTAÑAS ---
  const TabButton = ({ id, label, icon: Icon, color }) => (
      <button
        onClick={() => { setActiveTab(id); setSearchTerm(""); }}
        className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === id 
            ? `border-${color}-600 text-${color}-700 bg-${color}-50` 
            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Icon size={18} />
        {label}
        <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-700">
            {usuarios.filter(u => u.rol === id).length}
        </span>
      </button>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="text-indigo-600" /> Directorio de Usuarios
                </h1>
                <p className="text-gray-500 mt-1">Gestión centralizada del personal y alumnado.</p>
            </div>
            <button onClick={abrirModalCrear} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition shadow-md font-medium">
                <Plus size={20} /> Nuevo Usuario
            </button>
        </div>

        {/* --- SISTEMA DE PESTAÑAS (TABS) --- */}
        <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200 flex overflow-x-auto">
            <TabButton id="alumno" label="Estudiantes" icon={GraduationCap} color="green" />
            <TabButton id="profesor" label="Docentes" icon={Briefcase} color="indigo" />
            <TabButton id="admin" label="Administrativos" icon={Shield} color="red" />
        </div>

        {/* --- BARRA DE HERRAMIENTAS Y FILTROS --- */}
        <div className="bg-white p-4 rounded-b-xl shadow-sm border border-t-0 border-gray-200 flex flex-col md:flex-row gap-4">
            
            {/* Buscador General */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder={`Buscar ${activeTab === 'alumno' ? 'alumno' : activeTab}...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
            </div>

            {/* --- FILTROS ESPECÍFICOS PARA ALUMNOS --- */}
            {activeTab === "alumno" && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="relative min-w-[120px]">
                        <Filter className="absolute left-3 top-3 text-gray-400" size={16} />
                        <select 
                            value={filterAnio}
                            onChange={e => setFilterAnio(e.target.value)}
                            className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white cursor-pointer"
                        >
                            <option value="">Todos los Años</option>
                            {aniosAcademicos.map(a => <option key={a} value={a}>{a}° Año</option>)}
                        </select>
                    </div>

                    <div className="relative min-w-[120px]">
                         <ListChecks className="absolute left-3 top-3 text-gray-400" size={16} />
                         <select 
                            value={filterDivision}
                            onChange={e => setFilterDivision(e.target.value)}
                            className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white cursor-pointer"
                         >
                            <option value="">Todas Div.</option>
                            {["A", "B", "C", "D"].map(d => <option key={d} value={d}>División {d}</option>)}
                         </select>
                    </div>
                </div>
            )}
        </div>

        {/* --- TABLA DE RESULTADOS --- */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Información</th>
                                {/* Solo mostramos Curso si estamos en Alumnos */}
                                {activeTab === "alumno" && <th className="px-6 py-4">Curso</th>}
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {usuariosFiltrados.length > 0 ? (
                                usuariosFiltrados.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-50 transition-colors group">
                                        
                                        {/* Columna Nombre */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                                                    {u.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{u.nombre}</p>
                                                    <p className="text-xs text-gray-400">DNI: {u.dni || "N/D"}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Columna Info (Email) */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Mail size={14} /> {u.email}
                                            </div>
                                        </td>

                                        {/* Columna Curso (Solo alumnos) */}
                                        {activeTab === "alumno" && (
                                            <td className="px-6 py-4">
                                                {u.anio ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        {u.anio}° "{u.division || "?"}"
                                                    </span>
                                                ) : <span className="text-gray-400 text-xs">-</span>}
                                            </td>
                                        )}

                                        {/* Columna Estado */}
                                        <td className="px-6 py-4">
                                            {u.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Inactivo
                                                </span>
                                            )}
                                        </td>

                                        {/* Columna Acciones */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Botón Cobrar (Solo alumnos) */}
                                                {activeTab === 'alumno' && (
                                                    <button
                                                        onClick={() => setAlumnoSeleccionadoFinanzas(u)}
                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition"
                                                        title="Gestionar Pagos"
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                )}

                                                <button onClick={() => abrirModalEditar(u)} className="p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition" title="Editar">
                                                    <Edit3 size={16}/>
                                                </button>
                                                <button onClick={() => handleDelete(u._id)} className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 border border-gray-200 transition" title="Eliminar">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={activeTab === "alumno" ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users size={48} className="text-gray-200 mb-2"/>
                                            <p>No se encontraron usuarios en esta sección.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* MODALES */}
        {showModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                    <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800">{editandoId ? "Editar Usuario" : "Nuevo Usuario"}</h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleGuardar} className="p-6 space-y-4">
                        {/* El formulario se mantiene igual, pero ahora 'rol' viene pre-seteado */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol</label>
                            <div className="flex gap-2">
                                {/* Selector de Rol visual tipo botones */}
                                {["alumno", "profesor", "admin"].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setForm({...form, rol: r})}
                                        className={`flex-1 py-2 text-sm rounded-lg border capitalize transition ${
                                            form.rol === r 
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium" 
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input name="nombre" value={form.nombre} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="Nombre completo" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                                <input name="dni" value={form.dni} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="Documento" />
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="correo@ejemplo.com" />
                        </div>

                        {/* Campos específicos de Alumno con animación */}
                        {form.rol === 'alumno' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Año</label>
                                    <select name="anio" value={form.anio} onChange={handleInputChange} className="w-full p-2 border border-blue-200 rounded bg-white text-sm">
                                        <option value="">-</option>
                                        {aniosAcademicos.map(a => <option key={a} value={a}>{a}°</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 uppercase mb-1">División</label>
                                    <input name="division" value={form.division} onChange={handleInputChange} maxLength={1} className="w-full p-2 border border-blue-200 rounded bg-white text-sm uppercase text-center" placeholder="A" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                            <label htmlFor="isActive" className="text-sm text-gray-700 select-none">Cuenta Activa (Permitir acceso)</label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                            <button type="submit" disabled={loadingAction} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 transition shadow-sm">
                                {loadingAction ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL FINANZAS */}
        {alumnoSeleccionadoFinanzas && (
            <AdminGestionCuotas 
                alumno={alumnoSeleccionadoFinanzas} 
                onClose={() => setAlumnoSeleccionadoFinanzas(null)} 
            />
        )}
      </div>
    </div>
  );
};

export default UsuariosAdmin;