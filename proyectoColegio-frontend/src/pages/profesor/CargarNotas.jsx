// src/pages/profesor/CargarNotas.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { 
  GraduationCap, 
  Frown, 
  Search, 
  Loader2, 
  Check, 
  X 
} from "lucide-react";

// --- Componentes Reutilizables (sin cambios) ---

const SkeletonLoader = () => (
  <div className="space-y-3 animate-pulse p-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
        <div className="w-24 h-8 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed">
    <Frown className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
    <p className="mt-1 text-sm text-gray-500">
      Asegúrate de que los alumnos estén inscriptos correctamente.
    </p>
  </div>
);

// --- Componente de Celda de Promedio (sin cambios) ---
const PromedioCell = ({ valor }) => {
  const formateado = (valor === null || valor === undefined) ? "-" : Number(valor).toFixed(2);
  const esAprobado = valor !== null && Number(valor) >= 6;
  const colorClass = valor === null ? "text-gray-500" : esAprobado ? "text-green-600" : "text-red-600";

  return (
    <td className={`px-4 py-4 whitespace-nowrap text-center text-sm font-bold ${colorClass}`}>
      {formateado}
    </td>
  );
};

// --- Componente de Estado Final ---
const EstadoFinalCell = ({ estado }) => {
  if (!estado || estado === "-") {
    return <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-500">-</td>;
  }
  
  const esAprobado = estado === "Aprobado";
  const colorClass = esAprobado ? "text-green-800 bg-green-100" : "text-yellow-800 bg-yellow-100";

  return (
    <td className="px-4 py-4 whitespace-nowrap text-center text-xs font-semibold">
      <span className={`px-3 py-1 rounded-full ${colorClass}`}>
        {estado}
      </span>
    </td>
  );
};

// --- Componente de Celda de Nota (AHORA CON BOTÓN DE CONFIRMAR) ---
const NotaInput = ({ alumnoId, materiaId, trimestre, tipoNota, valorInicial, token, onNotaGuardada }) => {
  const [valorLocal, setValorLocal] = useState(valorInicial || "");
  const [isSaving, setIsSaving] = useState(false);
  
  // Regla de Inmutabilidad
  const camposInmutables = ["orientadora", "proceso"];
  const isSaved = valorInicial !== null && valorInicial !== undefined && valorInicial !== "";
  const isDisabled = isSaving || (camposInmutables.includes(tipoNota) && isSaved);
  
  // Detectar si hay cambios
  const hayCambio = valorLocal !== (valorInicial || "");

  useEffect(() => {
    setValorLocal(valorInicial || "");
  }, [valorInicial]);

  const handleConfirmSave = async () => {
    if (!hayCambio || isDisabled) return;

    // Validación
    const notaNum = Number(valorLocal);
    if (valorLocal !== "" && (isNaN(notaNum) || notaNum < 0 || notaNum > 10)) {
      toast.error("La nota debe ser un número entre 0 y 10.");
      setValorLocal(valorInicial || ""); // Revertir
      return;
    }

    setIsSaving(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/notas/guardar-una",
        {
          materiaId: materiaId,
          alumnoId: alumnoId,
          trimestre: trimestre,
          tipoNota: tipoNota,
          nota: valorLocal === "" ? null : notaNum,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Notificar al padre (CargarNotas) que se guardó
      onNotaGuardada(trimestre, alumnoId, res.data.nota);
      toast.success(`Nota de ${tipoNota} guardada.`);

    } catch (err) {
      toast.error(err.response?.data?.msg || "Error al guardar");
      setValorLocal(valorInicial || ""); // Revertir si falla
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setValorLocal(valorInicial || "");
  };

  return (
    <td className="px-2 py-4 whitespace-nowrap text-center relative">
      <div className="flex items-center justify-center gap-1">
        <input
          type="number"
          placeholder="-"
          min="0"
          max="10"
          step="0.01"
          className="w-20 p-2 text-center border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          value={valorLocal}
          onChange={(e) => setValorLocal(e.target.value)}
          disabled={isDisabled}
        />
        {/* Botones de Confirmar / Cancelar */}
        {hayCambio && !isDisabled && (
          <div className="flex flex-col">
            <button 
              onClick={handleConfirmSave} 
              className="p-0.5 text-green-600 rounded hover:bg-green-100"
              title="Confirmar"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleCancel} 
              className="p-0.5 text-red-600 rounded hover:bg-red-100"
              title="Cancelar"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </td>
  );
};

// --- Funciones de Cálculo de Promedio Final ---
const calcularPromedioFinal = (n1, n2, n3) => {
  const notas = [n1, n2, n3]
    .map(n => (n === null || n === undefined) ? null : Number(n))
    .filter(n => n !== null);
  
  // Solo calcular si están las 3 notas finales de los trimestres
  if (notas.length < 3) return null;

  const sum = notas.reduce((a, b) => a + b, 0);
  return sum / 3;
};

const getEstadoFinal = (promedio) => {
  if (promedio === null || promedio === undefined) return "-";
  return promedio >= 6 ? "Aprobado" : "Recuperacion";
};


// --- Componente Principal ---
const CargarNotas = () => {
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("");
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState("1");
  
  // --- CAMBIO DE ESTADO: Ahora guardamos todo en un solo objeto ---
  const [allNotes, setAllNotes] = useState({ 1: {}, 2: {}, 3: {} });
  
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const { token } = useAuth();

  // Traer materias del profesor (solo al inicio)
  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/materias/profesor/materias", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterias(res.data);
      } catch (err) {
        toast.error("Error al cargar materias.");
      }
    };
    fetchMaterias();
  }, [token]);

  // --- CAMBIO: Cargar alumnos Y TODAS las notas al cambiar la materia ---
  useEffect(() => {
    const fetchAlumnosYNotas = async () => {
      if (!materiaSeleccionada) {
        setAlumnos([]);
        setAllNotes({ 1: {}, 2: {}, 3: {} });
        return;
      }

      setLoadingAlumnos(true);
      try {
        // 1. Obtener lista de alumnos
        const resAlumnosPromise = axios.get(`http://localhost:5000/api/materias/${materiaSeleccionada}/alumnos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // 2. Obtener notas de los 3 trimestres en paralelo
        const resNotasT1Promise = axios.get(`http://localhost:5000/api/notas/materia/${materiaSeleccionada}?trimestre=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resNotasT2Promise = axios.get(`http://localhost:5000/api/notas/materia/${materiaSeleccionada}?trimestre=2`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resNotasT3Promise = axios.get(`http://localhost:5000/api/notas/materia/${materiaSeleccionada}?trimestre=3`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Esperar todas las respuestas
        const [resAlumnos, resNotasT1, resNotasT2, resNotasT3] = await Promise.all([
          resAlumnosPromise,
          resNotasT1Promise,
          resNotasT2Promise,
          resNotasT3Promise
        ]);

        setAlumnos(resAlumnos.data);
        setAllNotes({
          1: resNotasT1.data || {},
          2: resNotasT2.data || {},
          3: resNotasT3.data || {},
        });

      } catch (err) {
        toast.error("Error al obtener los datos de la materia.");
        setAlumnos([]);
        setAllNotes({ 1: {}, 2: {}, 3: {} });
      } finally {
        setLoadingAlumnos(false);
      }
    };

    fetchAlumnosYNotas();
  }, [materiaSeleccionada, token]);


  // Callback para actualizar el estado local cuando una nota se guarda
  const handleNotaGuardada = (trimestre, alumnoId, notaActualizada) => {
    setAllNotes(prev => ({
      ...prev,
      [trimestre]: {
        ...prev[trimestre],
        [alumnoId]: notaActualizada
      }
    }));
  };
  
  // Notas del trimestre seleccionado actualmente
  const notasTrimestreActual = allNotes[trimestreSeleccionado] || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* --- Encabezado --- */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-sky-100 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-sky-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cargar Notas</h1>
              <p className="text-sm text-gray-500">
                Selecciona materia y trimestre. Confirma cada nota con el tilde (✔️).
              </p>
            </div>
          </div>
        </div>
        
        {/* --- Selectores de Materia y Trimestre --- */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="materia-select" className="block text-sm font-medium text-gray-700 mb-2">
              Materia
            </label>
            <select
              id="materia-select"
              value={materiaSeleccionada}
              onChange={(e) => setMateriaSeleccionada(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            >
              <option value="">Selecciona una materia</option>
              {materias.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="trimestre-select" className="block text-sm font-medium text-gray-700 mb-2">
              Trimestre
            </label>
            <select
              id="trimestre-select"
              value={trimestreSeleccionado}
              onChange={(e) => setTrimestreSeleccionado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              disabled={!materiaSeleccionada}
            >
              <option value="1">Trimestre 1</option>
              <option value="2">Trimestre 2</option>
              <option value="3">Trimestre 3</option>
            </select>
          </div>
        </div>

        {/* --- Contenido Dinámico: Loader, Tabla o Mensaje --- */}
        <div>
          {loadingAlumnos ? (
            <SkeletonLoader />
          ) : alumnos.length > 0 ? (
            <div className="border-t border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                {/* --- Cabecera de tabla --- */}
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[250px]">
                      Alumno
                    </th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Orientadora (15%)</th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Proceso (25%)</th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-sky-700 uppercase w-28 bg-sky-50">Integradora (60%)</th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase w-28 bg-gray-100">Prom. Ponderado</th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Recuperación</th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-blue-800 uppercase w-28 bg-blue-50">Nota Final (Trim.)</th>
                    {/* --- NUEVAS COLUMNAS --- */}
                    <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-indigo-800 uppercase w-28 bg-indigo-50 border-l">Prom. Final (Anual)</th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-indigo-800 uppercase w-32 bg-indigo-50">Estado Final</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alumnos.map((alumno) => {
                    // Notas del trimestre actual
                    const notasTrimestre = notasTrimestreActual[alumno._id] || {};
                    
                    // --- Cálculo Final (se hace para cada alumno) ---
                    const n1 = allNotes[1][alumno._id]?.notaFinalTrimestre;
                    const n2 = allNotes[2][alumno._id]?.notaFinalTrimestre;
                    const n3 = allNotes[3][alumno._id]?.notaFinalTrimestre;
                    
                    const promFinalAnual = calcularPromedioFinal(n1, n2, n3);
                    const estadoFinalAnual = getEstadoFinal(promFinalAnual);
                    // --- Fin Cálculo Final ---

                    return (
                      <tr key={alumno._id} className="hover:bg-gray-50">
                        {/* Celda del Alumno (sticky) */}
                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white hover:bg-gray-50 z-10 border-r">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre)}&background=random`}
                              alt="Avatar"
                            />
                            <div className="ml-4 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{alumno.nombre}</div>
                              <div className="text-sm text-gray-500 truncate">{alumno.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* --- Celdas de Notas Editables --- */}
                        <NotaInput 
                          alumnoId={alumno._id} 
                          materiaId={materiaSeleccionada} 
                          trimestre={trimestreSeleccionado}
                          token={token} 
                          tipoNota="orientadora" 
                          valorInicial={notasTrimestre.orientadora} 
                          onNotaGuardada={handleNotaGuardada} 
                        />
                        <NotaInput 
                          alumnoId={alumno._id} 
                          materiaId={materiaSeleccionada} 
                          trimestre={trimestreSeleccionado}
                          token={token} 
                          tipoNota="proceso" 
                          valorInicial={notasTrimestre.proceso} 
                          onNotaGuardada={handleNotaGuardada} 
                        />
                        <NotaInput 
                          alumnoId={alumno._id} 
                          materiaId={materiaSeleccionada} 
                          trimestre={trimestreSeleccionado}
                          token={token} 
                          tipoNota="integradora" 
                          valorInicial={notasTrimestre.integradora} 
                          onNotaGuardada={handleNotaGuardada} 
                        />
                        
                        {/* --- Celdas Calculadas (Trimestral) --- */}
                        <PromedioCell valor={notasTrimestre.promedioPonderado} />

                        <NotaInput 
                          alumnoId={alumno._id} 
                          materiaId={materiaSeleccionada} 
                          trimestre={trimestreSeleccionado}
                          token={token} 
                          tipoNota="recuperacion" 
                          valorInicial={notasTrimestre.recuperacion} 
                          onNotaGuardada={handleNotaGuardada} 
                        />

                        <PromedioCell valor={notasTrimestre.notaFinalTrimestre} />

                        {/* --- Celdas Calculadas (Anual) --- */}
                        <PromedioCell valor={promFinalAnual} />
                        <EstadoFinalCell estado={estadoFinalAnual} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : materiaSeleccionada ? (
            <div className="p-6">
              <EmptyState message="No se encontraron alumnos para esta materia" />
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center py-12 px-6 bg-sky-50 rounded-lg border border-dashed border-sky-200">
                <Search className="mx-auto h-12 w-12 text-sky-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Comienza seleccionando una materia
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  La lista de alumnos aparecerá aquí.
                </p>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default CargarNotas;