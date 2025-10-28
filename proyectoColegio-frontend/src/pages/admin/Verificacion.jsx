import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Edit3, Trash2, X, Loader2, AlertCircle, Save, GraduationCap, Plus, Users // Import Users icon
} from "lucide-react";
import Swal from "sweetalert2";

// --- NUEVO: Helper para manejar select múltiple ---
const getSelectedOptions = (options) => {
  const selectedValues = [];
  for (let i = 0, l = options.length; i < l; i++) {
    if (options[i].selected) {
      selectedValues.push(options[i].value);
    }
  }
  return selectedValues;
};

const ClasesAdmin = () => {
  const { token } = useAuth();
  const [clases, setClases] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesoresList, setProfesoresList] = useState([]); // Renombrado para evitar confusión con el form state
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- CAMBIO: Estado del formulario actualizado ---
  const [form, setForm] = useState({
    materia: "",
    profesores: [], // Ahora es un array
    anio: "",
    division: "",   // Nuevo campo
    diaSemana: "",
    horaInicio: "",
    horaFin: ""
    // Eliminado anioCursada si ya no lo usas en el backend
  });
  // --- FIN CAMBIO ---

  const [showModal, setShowModal] = useState(false);
  // --- CAMBIO: Añadir filtro de división ---
  const [filter, setFilter] = useState({ anio: "", diaSemana: "", division: "" });
  // --- FIN CAMBIO ---

  const API_URL = "http://localhost:5000/api/clases";
  const AUX_DATA_URLS = {
    materias: "http://localhost:5000/api/materias",
    usuarios: "http://localhost:5000/api/usuarios"
  };

  useEffect(() => {
    fetchClases();
    fetchAuxiliaryData();
  }, [filter, token]); // filter ahora incluye division

  const fetchClases = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter, // filter ahora incluye division
      });
      // Asegurarse de que la respuesta del backend tenga 'clases'
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
        axios.get(AUX_DATA_URLS.materias, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(AUX_DATA_URLS.usuarios, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setMaterias(resMaterias.data || []);
      const soloProfesores = (resUsuarios.data || []).filter(u => u.rol === "profesor");
      setProfesoresList(soloProfesores); // Guardar en profesoresList
    } catch (err) {
      console.error("Error al cargar datos auxiliares:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // --- NUEVO: Handler para select múltiple ---
  const handleMultiSelectChange = (e) => {
    const selectedValues = getSelectedOptions(e.target.options);
    setForm(prev => ({ ...prev, profesores: selectedValues }));
  };
  // --- FIN NUEVO ---

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  // --- CAMBIO: Actualizado 'resetForm' ---
  const resetForm = () => {
    setForm({
      materia: "",
      profesores: [], // Array vacío
      anio: "",
      division: "",   // Campo nuevo
      diaSemana: "Lunes", // Resetear a Lunes o ""
      horaInicio: "",
      horaFin: ""
    });
    setEditingId(null);
    setShowModal(false);
  };
  // --- FIN CAMBIO ---

  // --- CAMBIO: Actualizado 'abrirModalEditar' ---
  const abrirModalEditar = (clase) => {
    setEditingId(clase.id); // Asegúrate que 'id' venga del backend
    setForm({
      materia: clase.materia?._id || clase.materia || "", // Manejar si viene populado o solo ID
      // Mapear el array de profesores populados a un array de IDs
      profesores: (clase.profesores || []).map(p => p._id || p),
      anio: clase.anio || "",
      division: clase.division || "", // Campo nuevo
      diaSemana: clase.diaSemana || "",
      // Asumiendo que 'horario' sigue viniendo como "HH:MM - HH:MM"
      horaInicio: clase.horario ? clase.horario.split(' - ')[0] : (clase.horaInicio || ""),
      horaFin: clase.horario ? clase.horario.split(' - ')[1] : (clase.horaFin || "")
    });
    setShowModal(true);
  };
  // --- FIN CAMBIO ---

  const abrirModalCrear = () => {
    resetForm();
    setShowModal(true);
  };

  // --- CAMBIO: 'handleGuardar' envía 'profesores' y 'division' ---
  const handleGuardar = async (e) => {
    e.preventDefault();
    // Validar que se haya seleccionado al menos un profesor
     if (form.profesores.length === 0) {
       Swal.fire("Error", "Debe seleccionar al menos un profesor.", "error");
       return;
     }
     if (!form.division) {
        Swal.fire("Error", "Debe ingresar la división.", "error");
        return;
     }

    setLoadingAction(true);
    // El 'form' state ya incluye 'profesores' (array) y 'division'
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("¡Actualizado!", "La clase ha sido modificada.", "success");
      } else {
        await axios.post(API_URL, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("¡Creado!", "La nueva clase ha sido registrada.", "success");
      }
      resetForm();
      fetchClases(); // Refrescar la lista
    } catch (err) {
      const msg = err.response?.data?.msg || "Hubo un error al guardar la clase.";
      console.error("Error al guardar clase:", err.response?.data);
      Swal.fire("Error", msg, "error");
    } finally {
      setLoadingAction(false);
    }
  };
  // --- FIN CAMBIO ---

  const handleEliminar = async (id) => {
    // ... (sin cambios)
  };

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const aniosAcademicos = [1, 2, 3, 4, 5, 6];
  const divisionesEjemplo = ["A", "B", "C"]; // O podrías cargarlas desde el backend

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6"> {/* Aumentado max-w */}
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           {/* ... (sin cambios en el título) ... */}
           <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Clases</h1>
              <p className="text-lg text-gray-600">Administra los horarios y asignaciones</p>
           </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow border flex flex-wrap items-center gap-4">
            <h3 className="text-md font-semibold text-gray-700 mr-2">Filtrar por:</h3>
            {/* Filtro Año */}
            <select name="anio" value={filter.anio} onChange={handleFilterChange} className="border p-2 rounded-md text-sm">
                <option value="">Año</option>
                {aniosAcademicos.map((a) => <option key={a} value={a}>{a}° Año</option>)}
            </select>
            {/* Filtro División */}
            <select name="division" value={filter.division} onChange={handleFilterChange} className="border p-2 rounded-md text-sm">
                 <option value="">División</option>
                 {divisionesEjemplo.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {/* Filtro Día */}
            <select name="diaSemana" value={filter.diaSemana} onChange={handleFilterChange} className="border p-2 rounded-md text-sm">
                 <option value="">Día</option>
                 {diasSemana.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {/* Botón Limpiar Filtros */}
            {(filter.anio || filter.division || filter.diaSemana) && (
                <button onClick={() => setFilter({ anio: "", diaSemana: "", division: "" })}
                        className="text-sm text-blue-600 hover:underline ml-auto">
                    Limpiar filtros
                </button>
            )}
        </div>


        {/* Tabla de Clases */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {loading ? (
             <div className="flex justify-center items-center p-12"> <Loader2 className="animate-spin text-3xl text-blue-500" /> </div>
          ) : clases.length === 0 ? (
             <div className="text-center p-12 text-gray-500">
                <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="font-semibold">No hay clases registradas {filter.anio || filter.division || filter.diaSemana ? 'con los filtros aplicados' : ''}.</p>
                <button onClick={abrirModalCrear} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                   <Plus size={16} /> Crear Nueva Clase
                </button>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="p-4 flex justify-end">
                <button onClick={abrirModalCrear} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                  <Plus size={16} /> Crear Nueva Clase
                </button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Materia</th>
                    {/* --- CAMBIO: Columna Profesores --- */}
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Profesor(es)</th>
                    {/* --- FIN CAMBIO --- */}
                    {/* --- CAMBIO: Año y División combinados --- */}
                    <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Curso</th>
                    {/* --- FIN CAMBIO --- */}
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Día</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Horario</th>
                    <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clases.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.materia?.nombre || "N/A"}</td>
                      {/* --- CAMBIO: Mostrar lista de profesores --- */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                         {(c.profesores || []).map(p => p.nombre).join(', ') || "N/A"}
                      </td>
                      {/* --- FIN CAMBIO --- */}
                      {/* --- CAMBIO: Mostrar Año y División --- */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{c.anio ? `${c.anio}° ${c.division || ''}` : "N/A"}</td>
                      {/* --- FIN CAMBIO --- */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{c.diaSemana || "N/A"}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{c.horario || `${c.horaInicio || '?'} - ${c.horaFin || '?'}`}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => abrirModalEditar(c)} className="text-indigo-600 hover:text-indigo-800" title="Editar"><Edit3 size={16} /></button>
                          <button onClick={() => handleEliminar(c.id)} className="text-red-600 hover:text-red-800" title="Eliminar"><Trash2 size={16} /></button>
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in-down"> {/* Animación simple */}
              <button onClick={resetForm} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h3 className="text-xl font-semibold text-gray-900 mb-5 border-b pb-3">
                {editingId ? "Editar Clase" : "Crear Nueva Clase"}
              </h3>
              <form onSubmit={handleGuardar} className="grid gap-4">
                {/* Materia */}
                <select name="materia" value={form.materia} onChange={handleInputChange} required className="input-style">
                   <option value="">Seleccionar Materia</option>
                   {materias.map((m) => <option key={m._id} value={m._id}>{m.nombre} ({m.anio}° Año)</option>)}
                </select>

                {/* --- CAMBIO: Select Múltiple Profesores --- */}
                <div>
                   <label className="block text-xs font-medium text-gray-600 mb-1">Profesor(es)</label>
                   <select name="profesores" multiple value={form.profesores} onChange={handleMultiSelectChange} required className="input-style h-28">
                     {profesoresList.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                   </select>
                   <p className="text-xs text-gray-500 mt-1">Ctrl+Click para seleccionar varios.</p>
                </div>
                {/* --- FIN CAMBIO --- */}

                {/* Año y División */}
                <div className="grid grid-cols-2 gap-4">
                   <select name="anio" value={form.anio} onChange={handleInputChange} required className="input-style">
                     <option value="">Año Académico</option>
                     {aniosAcademicos.map((a) => <option key={a} value={a}>{a}° Año</option>)}
                   </select>
                   {/* --- CAMBIO: Input División --- */}
                   <input type="text" name="division" value={form.division} onChange={handleInputChange} placeholder="División (Ej: A)" required maxLength={1} className="input-style uppercase"/>
                   {/* --- FIN CAMBIO --- */}
                </div>

                {/* Día */}
                <select name="diaSemana" value={form.diaSemana} onChange={handleInputChange} required className="input-style">
                  {diasSemana.map((dia) => <option key={dia} value={dia}>{dia}</option>)}
                </select>

                {/* Horarios */}
                <div className="grid grid-cols-2 gap-4">
                   <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleInputChange} required className="input-style"/>
                   <input type="time" name="horaFin" value={form.horaFin} onChange={handleInputChange} required className="input-style"/>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                  <button type="button" onClick={resetForm} className="btn-secondary" disabled={loadingAction}>Cancelar</button>
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
       {/* --- Estilos CSS reutilizables --- */}
       <style jsx global>{`
         .input-style {
           @apply w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white;
         }
         .btn-primary {
           @apply inline-flex items-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
         }
         .btn-secondary {
            @apply inline-flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
         }
         @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
         .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
       `}</style>
    </div>
  );
};

export default ClasesAdmin;