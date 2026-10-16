import { useState } from 'react';
import { toast } from 'react-toastify';
import { CalendarCheck, UserCheck, Save, School, Loader2, Users } from 'lucide-react';
import {
getAsistenciaGeneral,
registrarAsistenciaGeneral,
} from '../../api/api';

const TomarAsistenciaAdmin = () => {
const [anio, setAnio] = useState('');
const [division, setDivision] = useState('');
const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
const [alumnos, setAlumnos] = useState([]);
const [asistencias, setAsistencias] = useState({});
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [filtrosCargados, setFiltrosCargados] = useState(null);

const aniosDisponibles = ['1', '2', '3', '4', '5', '6'];
const divisionesDisponibles = ['A', 'B', 'C'];

const fetchAlumnosYAsistencia = async () => {
  if (!anio || !division || !fecha) {
    toast.info('Selecciona año, división y fecha para cargar la lista.');
    return;
  }
  setLoading(true);
  setAlumnos([]);
  setAsistencias({});
  setFiltrosCargados(null);
  try {
    const { data } = await getAsistenciaGeneral(anio, division, fecha);
    setAlumnos(data);
    setAsistencias(Object.fromEntries(data.map(({ _id, estado }) => [_id, estado || 'presente'])));
    setFiltrosCargados({ anio, division, fecha });
    if (data.length === 0) toast.warn(`No se encontraron alumnos para ${anio}° ${division}.`);
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.msg || 'Error al cargar alumnos o asistencias.');
  } finally {
    setLoading(false);
  }
};

const cambiarEstadoAsistencia = (alumnoId, estado) => {
    setAsistencias((prev) => ({
      ...prev,
      [alumnoId]: estado,
    }));
  };

  const marcarTodos = (estado) => {
    if (alumnos.length === 0) return;
    const nuevoEstado = {};
    alumnos.forEach((a) => {
      nuevoEstado[a._id] = estado;
    });
    setAsistencias(nuevoEstado);
  };

  const guardarAsistencia = async () => {
    if (alumnos.length === 0) {
      toast.error('No hay alumnos en la lista para guardar.');
      return;
    }

    if (!filtrosCargados || filtrosCargados.anio !== anio || filtrosCargados.division !== division || filtrosCargados.fecha !== fecha) {
      toast.error('Vuelve a cargar los alumnos para el curso y fecha seleccionados.');
      return;
    }

    setSaving(true);
    try {
      await registrarAsistenciaGeneral({
        anio,
        division,
        fecha,
        asistencias: Object.entries(asistencias).map(([alumno, estado]) => ({ alumno, estado })),
      });
      toast.success('Asistencia general registrada correctamente.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || 'Error al guardar asistencia');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = 'w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm disabled:bg-gray-50';
  const btnPrimaryStyle = 'inline-flex items-center justify-center bg-blue-600 text-white font-bold px-4 py-3 rounded-lg text-sm shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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