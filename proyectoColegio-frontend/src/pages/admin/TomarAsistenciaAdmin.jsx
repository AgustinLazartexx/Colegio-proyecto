import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CalendarCheck, UserCheck, Save, School, Loader2, Users } from 'lucide-react';
import api from '../../api/api';


// 🔹 CORRECCIÓN: Importar todo desde 'api.js'
import {
  getAlumnosPorCurso,
  obtenerAsistenciasPorClaseYFecha,
  registrarAsistencias,
  getTodasLasClases // Importar la función correcta
} from '../../api/api'; // <-- Apuntar al archivo api.js

const TomarAsistenciaAdmin = () => {
  const [anio, setAnio] = useState('');
  const [division, setDivision] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allClases, setAllClases] = useState([]);

  const aniosDisponibles = ['1', '2', '3', '4', '5', '6'];
  const divisionesDisponibles = ['A', 'B', 'C'];

  // 1. Cargar la lista de TODAS las clases
  useEffect(() => {
    const loadClases = async () => {
      try {
        // 🔹 CORRECCIÓN: Usar la función importada 'getTodasLasClases'
        const res = await getTodasLasClases(); 
        
        // 🔹 CORRECCIÓN: El error estaba aquí. 'res.data' sí existe ahora.
        setAllClases(res.data.clases || []);
        
        console.log("CLASES CARGADAS DESDE LA API:", res.data.clases);

      } catch (e) {
        toast.error('Error: No se pudo cargar la lista de clases.');
        console.error("Error cargando clases:", e);
      }
    };
    loadClases();
  }, []);

  // 2. (Esta función está bien)
  const findGeneralClaseId = () => {
    if (!anio || !division) return null;
    console.log(`Buscando clase con Año: "${anio}" y División: "${division}"`);

    const generalClass = allClases.find((c) => {
      const anioMatch = String(c.anio) === String(anio);
      const divisionMatch = String(c.division).toUpperCase() === String(division).toUpperCase();
      const materiaMatch = c.materia && c.materia.nombre.toLowerCase().includes('asistencia general');
      return anioMatch && divisionMatch && materiaMatch;
    });
    console.log('Clase "General" encontrada:', generalClass);
    return generalClass ? generalClass.id : null; 
  };

  // 3. Cargar alumnos y asistencias previas
  const fetchAlumnosYAsistencia = async () => {
    if (!anio || !division || !fecha) {
      toast.info('Selecciona año, división y fecha para cargar la lista.');
      return;
    }
    setLoading(true);
    setAlumnos([]);
    setAsistencias({});
    const claseId = findGeneralClaseId(); 

    if (!claseId) {
      toast.error(
        `No se encontró una clase de "Asistencia General" para ${anio}° ${division}.`
      );
      toast.info('Asegúrate de crearla en el panel "Gestionar Clases".');
      setLoading(false);
      return;
    }

    try {
      // 3b. Cargar alumnos
      // 🔹 CORRECCIÓN: 'getAlumnosPorCurso' ahora devuelve la respuesta de Axios
      const resAlumnos = await getAlumnosPorCurso(anio, division);
      const alumnosEncontrados = resAlumnos.data || []; // La data está en .data
      setAlumnos(alumnosEncontrados);

      if (alumnosEncontrados.length === 0) {
        toast.warn(`No se encontraron alumnos para ${anio}° ${division}.`);
        setLoading(false);
        return;
      }

      // 3c. Cargar asistencias (Esta función ya devuelve la data)
      const asistenciasGuardadas = await obtenerAsistenciasPorClaseYFecha(
        claseId,
        fecha
      );

      // 3d. Mezclar
      const inicial = {};
      alumnosEncontrados.forEach((a) => {
        inicial[a._id] = asistenciasGuardadas[a._id] || 'presente';
      });
      setAsistencias(inicial);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar alumnos o asistencias.');
    } finally {
      setLoading(false);
    }
  };

  // (El resto de las funciones no necesitan cambios)

  // 🔹 Cambiar estado de asistencia (sin cambios)
  const cambiarEstadoAsistencia = (alumnoId, estado) => {
    setAsistencias((prev) => ({
      ...prev,
      [alumnoId]: estado,
    }));
  };

  // 🔹 Marcar todos como... (sin cambios)
  const marcarTodos = (estado) => {
    if (alumnos.length === 0) return;
    const nuevoEstado = {};
    alumnos.forEach((a) => {
      nuevoEstado[a._id] = estado;
    });
    setAsistencias(nuevoEstado);
  };

  // 4. 🔹 Guardar asistencia (LÓGICA Y RUTA CORREGIDAS)
  const guardarAsistencia = async () => {
    if (alumnos.length === 0) {
      toast.error('No hay alumnos en la lista para guardar.');
      return;
    }

    const claseId = findGeneralClaseId();
    if (!claseId) {
      toast.error(
        `Error: No se pudo encontrar la clase "Asistencia General" para ${anio}° ${division}.`
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        claseId: claseId, 
        fecha: fecha,
        asistencias: Object.entries(asistencias).map(([alumno, estado]) => ({
          alumno,
          estado,
        })),
      };

      await registrarAsistencias(payload); 

      toast.success('Asistencia registrada correctamente 🎯');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || 'Error al guardar asistencia');
    } finally {
      setSaving(false);
    }
  };

  // --- Constantes de Estilo (sin cambios) ---
  const inputStyle = 'w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm disabled:bg-gray-50';
  const btnPrimaryStyle = 'inline-flex items-center justify-center bg-blue-600 text-white font-bold px-4 py-3 rounded-lg text-sm shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header (sin cambios) */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full shadow-md">
              <CalendarCheck className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tomar Asistencia (Admin)
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Registra la asistencia general por curso y división.
          </p>
        </div>

        {/* Selección de curso (sin cambios) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`${inputStyle} md:col-span-1`}
            />
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className={`${inputStyle} md:col-span-1`}
            >
              <option value="">Seleccionar Año</option>
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}° Año
                </option>
              ))}
            </select>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className={`${inputStyle} md:col-span-1`}
            >
              <option value="">División</option>
              {divisionesDisponibles.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {/* El botón ahora llama a la nueva función */}
            <button
              onClick={fetchAlumnosYAsistencia}
              disabled={loading}
              className={`${btnPrimaryStyle} md:col-span-1`}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <Users size={18} className="mr-2" />
              )}
              {loading ? 'Cargando...' : 'Cargar Alumnos'}
            </button>
          </div>
        </div>

        {/* Lista de alumnos (sin cambios estéticos) */}
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
            <p className="text-gray-600 mt-4">Cargando alumnos...</p>
          </div>
        ) : alumnos.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserCheck className="text-blue-600" /> Lista de Alumnos (
                {alumnos.length})
              </h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => marcarTodos('presente')}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200"
                >
                  Marcar Todos Presentes
                </button>
                <button
                  onClick={() => marcarTodos('ausente')}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Marcar Todos Ausentes
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {alumnos.map((alumno) => (
                <div
                  key={alumno._id}
                  className="flex flex-col md:flex-row md:items-center justify-between border p-4 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-3 mb-3 md:mb-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {alumno.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {alumno.nombre}
                      </p>
                      <p className="text-gray-600 text-xs">{alumno.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end flex-wrap">
                    {['presente', 'ausente', 'tarde', 'justificado'].map(
                      (estado) => {
                        const baseStyle =
                          'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 capitalize';
                        const activeStyle = {
                          presente: 'bg-green-600 text-white shadow-md',
                          ausente: 'bg-red-600 text-white shadow-md',
                          tarde: 'bg-yellow-500 text-white shadow-md',
                          justificado: 'bg-blue-600 text-white shadow-md',
                        };
                        const inactiveStyle = {
                          presente:
                            'bg-gray-200 text-gray-700 hover:bg-green-100 hover:text-green-700',
                          ausente:
                            'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700',
                          tarde:
                            'bg-gray-200 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700',
                          justificado:
                            'bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-700',
                        };
                        const isActive = asistencias[alumno._id] === estado;

                        return (
                          <button
                            key={estado}
                            onClick={() =>
                              cambiarEstadoAsistencia(alumno._id, estado)
                            }
                            className={`${baseStyle} ${
                              isActive
                                ? activeStyle[estado]
                                : inactiveStyle[estado]
                            }`}
                          >
                            {estado}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-100">
              <button
                onClick={guardarAsistencia}
                disabled={saving || loading}
                className="inline-flex items-center justify-center bg-green-600 text-white font-bold px-4 py-3 rounded-lg text-sm shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 w-full sm:w-auto"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Guardando...' : 'Guardar Asistencia'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-600 shadow-lg border border-gray-200">
            <School className="mx-auto mb-4 text-gray-400" size={40} />
            {!anio || !division
              ? 'Selecciona un año y división para cargar la lista de alumnos.'
              : 'No hay alumnos registrados en esta sección.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TomarAsistenciaAdmin;