import { useEffect, useState } from "react";
import { 
  getMisClases, 
  getAlumnosDeClase, 
  registrarAsistencias, 
  obtenerAsistenciaFecha 
} from "../../api/api";
import { toast } from "react-toastify";
import { CalendarCheck, Save, Loader2, Users } from "lucide-react";

const TomarAsistencia = () => {
  const [clases, setClases] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // 1. Cargar las clases del profesor al iniciar
  useEffect(() => {
    const cargarClases = async () => {
      try {
        const res = await getMisClases();
        // Tu backend devuelve { clases: [...] }, aseguramos leer eso correctamente
        const listaClases = res.data.clases || res.data || [];
        setClases(Array.isArray(listaClases) ? listaClases : []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar tus clases.");
      }
    };
    cargarClases();
  }, []);

  // 2. Cuando cambia la clase o la fecha, cargar alumnos y estado actual
  useEffect(() => {
    if (!claseSeleccionada) {
        setAlumnos([]);
        return;
    }

    const cargarDatos = async () => {
      setLoading(true);
      try {
        // A. Traer alumnos inscritos en esta clase
        const resAlumnos = await getAlumnosDeClase(claseSeleccionada);
        const listaAlumnos = resAlumnos.data.alumnos || resAlumnos.data || [];
        
        // B. Traer asistencia ya guardada (si existe) para esta fecha
        let historial = {};
        try {
             const resHistorial = await obtenerAsistenciaFecha(claseSeleccionada, fecha);
             historial = resHistorial.data || {}; 
        } catch (error) {
             // No hay asistencia previa, es normal
        }

        setAlumnos(listaAlumnos);

        // C. Combinar: Si hay historial, usarlo. Si no, "presente" por defecto.
        const estadoInicial = {};
        listaAlumnos.forEach(alumno => {
            const id = alumno._id; // El alumno SI usa _id porque es un documento directo de User
            estadoInicial[id] = historial[id] || "presente"; 
        });
        setAsistencias(estadoInicial);

      } catch (err) {
        console.error(err);
        toast.error("Error al cargar alumnos de la clase.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [claseSeleccionada, fecha]);

  const handleEstadoChange = (alumnoId, nuevoEstado) => {
    setAsistencias(prev => ({
      ...prev,
      [alumnoId]: nuevoEstado
    }));
  };

  const guardarCambios = async () => {
    if (!claseSeleccionada) return toast.warning("Selecciona una clase");
    
    setGuardando(true);
    try {
      const arrayAsistencias = Object.entries(asistencias).map(([id, estado]) => ({
        alumno: id,
        estado: estado
      }));

      const payload = {
        claseId: claseSeleccionada,
        fecha: fecha,
        asistencias: arrayAsistencias
      };

      await registrarAsistencias(payload);
      toast.success("Asistencia guardada correctamente");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarCheck className="text-blue-600"/> Tomar Asistencia
            </h1>
            <p className="text-gray-500 text-sm mt-1">Selecciona clase y fecha para gestionar</p>
        </div>
        
        <div className="flex gap-3 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <select 
                className="bg-transparent outline-none text-gray-700 font-medium max-w-xs"
                value={claseSeleccionada}
                onChange={(e) => setClaseSeleccionada(e.target.value)}
            >
                <option value="">-- Seleccionar Clase --</option>
                {clases.map(c => (
                    // CORRECCIÓN AQUÍ: Usar c.id (o c._id como fallback)
                    <option key={c.id || c._id} value={c.id || c._id}>
                        {c.materia?.nombre || "Materia sin nombre"} ({c.diaSemana} {c.horaInicio})
                    </option>
                ))}
            </select>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <input 
                type="date" 
                className="bg-transparent outline-none text-gray-700 font-medium"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
            />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Cargando alumnos...</p>
        </div>
      ) : !claseSeleccionada ? (
        <div className="py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Selecciona una clase para comenzar</p>
        </div>
      ) : alumnos.length === 0 ? (
        <div className="py-10 text-center bg-yellow-50 rounded-lg text-yellow-700 border border-yellow-100">
            No hay alumnos inscritos en esta clase. Contacta al administrador.
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-bold">
                        <tr>
                            <th className="p-4 text-left">Alumno</th>
                            <th className="p-4 text-center text-green-600">Presente</th>
                            <th className="p-4 text-center text-red-500">Ausente</th>
                            <th className="p-4 text-center text-orange-500">Tarde</th>
                            <th className="p-4 text-center text-blue-500">Justificado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {alumnos.map((alum) => (
                            <tr key={alum._id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <p className="font-semibold text-gray-800">{alum.nombre} {alum.apellido}</p>
                                    <span className="text-xs text-gray-400">{alum.dni}</span>
                                </td>
                                {['presente', 'ausente', 'tarde', 'justificado'].map((estado) => (
                                    <td key={estado} className="p-4 text-center">
                                        <input 
                                            type="radio"
                                            name={`asistencia-${alum._id}`}
                                            className="w-5 h-5 cursor-pointer accent-blue-600"
                                            checked={asistencias[alum._id] === estado}
                                            onChange={() => handleEstadoChange(alum._id, estado)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button 
                    onClick={guardarCambios}
                    disabled={guardando}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {guardando ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                    {guardando ? "Guardando..." : "Guardar Asistencia"}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default TomarAsistencia;