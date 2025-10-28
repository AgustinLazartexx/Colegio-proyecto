import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify"; // Usaremos toast para notificaciones
import { Loader2, PlusCircle, AlertTriangle } from "lucide-react"; // Iconos

const CrearClase = () => {
  const { token, usuario } = useAuth(); // Cambiado 'user' a 'usuario' para consistencia
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(false); // Para carga inicial
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el envío del form
  const [error, setError] = useState("");

  // --- CAMBIO: Estado del formulario actualizado ---
  const [form, setForm] = useState({
    materia: "",
    profesores: [], // Ahora es un array
    anio: "",
    division: "", // Nuevo campo
    diaSemana: "Lunes",
    horaInicio: "",
    horaFin: ""
  });
  // --- FIN CAMBIO ---

  const aniosCursada = [
    { value: 1, label: "1° Año" }, { value: 2, label: "2° Año" },
    { value: 3, label: "3° Año" }, { value: 4, label: "4° Año" },
    { value: 5, label: "5° Año" }, { value: 6, label: "6° Año" }
  ];
  const diasSemanaOpts = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  // Cargar materias y profesores
  useEffect(() => {
    const cargarDatos = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [materiasRes, usuariosRes] = await Promise.all([
          axios.get("http://localhost:5000/api/materias", { headers }),
          axios.get("http://localhost:5000/api/usuarios", { headers }) // Asume que este endpoint devuelve todos los usuarios
        ]);

        setMaterias(materiasRes.data || []);
        const profesoresFiltrados = (usuariosRes.data || []).filter((u) => u.rol === "profesor");
        setProfesores(profesoresFiltrados);

      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar datos iniciales (materias/profesores).");
        toast.error("Error al cargar datos iniciales.");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [token]);

  // --- CAMBIO: Manejar input normal y select múltiple ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(""); // Limpiar error al cambiar
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setForm(prev => ({ ...prev, [name]: selectedValues }));
    setError("");
  };
  // --- FIN CAMBIO ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validaciones del frontend
    if (!form.materia || form.profesores.length === 0 || !form.anio || !form.division || !form.horaInicio || !form.horaFin) {
      setError("Todos los campos son obligatorios (al menos un profesor).");
      setIsSubmitting(false);
      return;
    }
    if (form.horaInicio >= form.horaFin) {
      setError("La hora de inicio debe ser anterior a la hora de finalización.");
      setIsSubmitting(false);
      return;
    }
    // Añadir validación simple para división (ej. solo una letra)
    if (!/^[A-Z]$/i.test(form.division)) {
       setError("La división debe ser una sola letra (A, B, C...).");
       setIsSubmitting(false);
       return;
    }


    // --- CAMBIO: Enviar 'profesores' como array y añadir 'division' ---
    const payload = {
      ...form,
      division: form.division.toUpperCase() // Enviar en mayúsculas
    };
    // --- FIN CAMBIO ---

    try {
      const response = await axios.post("http://localhost:5000/api/clases", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success("✅ Clase creada exitosamente");
      // Resetear formulario
      setForm({
        materia: "", profesores: [], anio: "", division: "",
        diaSemana: "Lunes", horaInicio: "", horaFin: ""
      });

    } catch (error) {
      console.error("Error al crear clase:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.msg || "Error al crear la clase. Verifique los datos e intente nuevamente.";
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Verificar si el usuario es Admin (asumiendo que viene del AuthContext)
  if (usuario && usuario.rol !== 'admin') {
     return (
        <div className="p-6 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2"/>
            <p className="font-semibold text-yellow-800">Acceso Denegado</p>
            <p className="text-sm text-yellow-700">Solo los administradores pueden crear clases.</p>
        </div>
     )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3 flex items-center gap-2">
        <PlusCircle size={20} className="text-blue-600"/>
        Crear Nueva Clase
      </h2>

      {/* Alerta de error */}
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-md flex items-center gap-2">
           <AlertTriangle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Materia */}
        <div>
          <label htmlFor="materia" className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
          <select
            id="materia" name="materia" value={form.materia}
            onChange={handleInputChange} required
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar materia</option>
            {materias.map(m => <option key={m._id} value={m._id}>{m.nombre} ({m.anio}° Año)</option>)}
          </select>
        </div>

        {/* --- CAMBIO: Selector Múltiple de Profesores --- */}
        <div>
          <label htmlFor="profesores" className="block text-sm font-medium text-gray-700 mb-1">Profesor(es)</label>
          <select
            id="profesores" name="profesores" multiple // <-- Atributo 'multiple'
            value={form.profesores} // value es un array de IDs
            onChange={handleMultiSelectChange} // <-- Nuevo handler
            required
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 h-24" // Aumentar altura
          >
            {/* <option value="" disabled>Seleccionar uno o más profesores (Ctrl+Click)</option> */}
            {profesores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar varios.</p>
        </div>
        {/* --- FIN CAMBIO --- */}

        {/* Año y División en línea */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="anio" className="block text-sm font-medium text-gray-700 mb-1">Año Cursada</label>
            <select
              id="anio" name="anio" value={form.anio}
              onChange={handleInputChange} required
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar año</option>
              {aniosCursada.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          {/* --- NUEVO CAMPO: División --- */}
          <div>
            <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">División</label>
            <input
              type="text" id="division" name="division" value={form.division}
              onChange={handleInputChange} required maxLength={1} placeholder="Ej: A"
              className="w-full p-2 border border-gray-300 rounded-md text-sm uppercase focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* --- FIN NUEVO CAMPO --- */}
        </div>

        {/* Día y Horarios */}
        <div>
          <label htmlFor="diaSemana" className="block text-sm font-medium text-gray-700 mb-1">Día de la Semana</label>
          <select
            id="diaSemana" name="diaSemana" value={form.diaSemana}
            onChange={handleInputChange} required
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {diasSemanaOpts.map(dia => <option key={dia} value={dia}>{dia}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
            <input
              type="time" id="horaInicio" name="horaInicio" value={form.horaInicio}
              onChange={handleInputChange} required
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
            <input
              type="time" id="horaFin" name="horaFin" value={form.horaFin}
              onChange={handleInputChange} required
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...
            </span>
          ) : "Crear Clase"}
        </button>
      </form>
    </div>
  );
};

export default CrearClase;