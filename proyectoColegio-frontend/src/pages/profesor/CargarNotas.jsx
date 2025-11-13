// src/pages/profesor/CargarNotas.jsx (o ruta compartida)
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  GraduationCap,
  Frown,
  Search,
  Loader2,
  Check,
  X,
  ChevronDown, // --- UPGRADE: Para el selector de trimestre (móvil)
} from "lucide-react";
// --- UPGRADE: Importamos framer-motion para animaciones
import { motion, AnimatePresence } from "framer-motion";

// --- Componentes Reutilizables Mejorados ---

// --- UPGRADE: SkeletonLoader con efecto "Shimmer" (más moderno que pulse) ---
const SkeletonLoader = () => (
  <div className="space-y-3 p-6">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="flex items-center space-x-4 p-2 relative overflow-hidden rounded-md bg-gray-100"
      >
        {/* El fondo del shimmer */}
        <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></span>

        {/* Estructura del esqueleto */}
        <div className="w-10 h-10 bg-gray-300 rounded-full shrink-0"></div>
        <div className="flex-1 h-4 bg-gray-300 rounded"></div>
        <div className="w-24 h-8 bg-gray-300 rounded"></div>
      </div>
    ))}
  </div>
);

// --- UPGRADE: Nuevo componente de control segmentado para los trimestres ---
const SegmentedControl = ({ options, value, onChange }) => {
  return (
    <div className="hidden md:flex items-center p-1 bg-gray-100 rounded-lg">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            value === option.value
              ? "text-sky-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {/* El "slider" animado de fondo */}
          {value === option.value && (
            <motion.div
              layoutId="trimestre-active-pill"
              className="absolute inset-0 bg-white shadow-sm rounded-md z-0"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

// --- UPGRADE: Selector nativo para móviles (usa el SegmentedControl en desktop) ---
const TrimestreSelector = ({ value, onChange }) => {
  const options = [
    { label: "Trimestre 1", value: "1" },
    { label: "Trimestre 2", value: "2" },
    { label: "Trimestre 3", value: "3" },
  ];

  return (
    <div>
      {/* Control Segmentado para pantallas medianas y grandes */}
      <SegmentedControl options={options} value={value} onChange={onChange} />

      {/* Select nativo para pantallas pequeñas */}
      <div className="md:hidden relative w-full max-w-xs">
        <select
          id="trimestre-select-mobile"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition appearance-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed">
    <Frown className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
    <p className="mt-1 text-sm text-gray-500">
      Asegúrate de que los alumnos estén inscriptos correctamente.
    </p>
  </div>
);

// --- UPGRADE: Celda de Promedio con feedback visual más sutil ---
const PromedioCell = ({ valor }) => {
  const formateado =
    valor === null || valor === undefined ? "-" : Number(valor).toFixed(2);
  const esAprobado = valor !== null && Number(valor) >= 6;
  const colorClass =
    valor === null
      ? "text-gray-500 bg-gray-50"
      : esAprobado
      ? "text-green-700 bg-green-50"
      : "text-red-700 bg-red-50";

  return (
    <td
      className={`px-4 py-4 whitespace-nowrap text-center text-sm font-bold ${colorClass}`}
    >
      {formateado}
    </td>
  );
};

// --- UPGRADE: EstadoFinalCell con colores más integrados ---
const EstadoFinalCell = ({ estado }) => {
  if (!estado || estado === "-") {
    return (
      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-500">
        -
      </td>
    );
  }

  const esAprobado = estado === "Aprobado";
  const colorClass = esAprobado
    ? "text-green-800 bg-green-100"
    : "text-amber-800 bg-amber-100"; // --- UPGRADE: Amarillo/Ámbar para "Recuperación"

  return (
    <td className="px-4 py-4 whitespace-nowrap text-center text-xs font-semibold">
      <span className={`px-3 py-1 rounded-full ${colorClass}`}>{estado}</span>
    </td>
  );
};

// --- Componente de Celda de Nota (con Rol y Botón Confirmar) ---
const NotaInput = ({
  alumnoId,
  materiaId,
  trimestre,
  tipoNota,
  valorInicial,
  token,
  rol,
  onNotaGuardada,
}) => {
  const [valorLocal, setValorLocal] = useState(valorInicial || "");
  const [isSaving, setIsSaving] = useState(false);

  const isSaved =
    valorInicial !== null && valorInicial !== undefined && valorInicial !== "";
  const isDisabled = isSaving || (rol === "profesor" && isSaved);
  const hayCambio = String(valorLocal) !== String(valorInicial || "");

  useEffect(() => {
    setValorLocal(valorInicial || "");
  }, [valorInicial]);

  const handleConfirmSave = async () => {
    // ... (misma lógica de guardado)
    if (!hayCambio || isSaving) return;
    if (rol === "profesor" && isSaved) {
      toast.warn("Esta nota ya fue guardada y no puede modificarla.");
      return;
    }
    const notaNum = Number(valorLocal);
    if (valorLocal !== "" && (isNaN(notaNum) || notaNum < 0 || notaNum > 10)) {
      toast.error("La nota debe ser un número entre 0 y 10.");
      setValorLocal(valorInicial || "");
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
      onNotaGuardada(trimestre, alumnoId, res.data.nota);
      toast.success(`Nota de ${tipoNota} guardada.`);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error al guardar");
      setValorLocal(valorInicial || "");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValorLocal(valorInicial || "");
  };

  // --- UPGRADE: Clases dinámicas para el input (feedback visual) ---
  const inputClasses = [
    "w-20 p-2 text-center border rounded-md focus:outline-none",
    "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
    "transition-all duration-150",
    isSaving
      ? "bg-gray-100 animate-pulse"
      : hayCambio
      ? "border-sky-500 ring-2 ring-sky-200"
      : isSaved
      ? "border-green-200 bg-green-50"
      : "border-gray-300",
  ].join(" ");

  return (
    <td className="px-2 py-4 whitespace-nowrap text-center relative">
      <div className="flex items-center justify-center gap-1.5">
        <input
          type="number"
          placeholder="-"
          min="0"
          max="10"
          step="0.01"
          className={inputClasses}
          value={valorLocal}
          onChange={(e) => setValorLocal(e.target.value)}
          disabled={isDisabled}
        />

        {/* --- UPGRADE: Animación en botones de confirmar/cancelar --- */}
        <AnimatePresence>
          {hayCambio && !isDisabled && (
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <button
                onClick={handleConfirmSave}
                className="p-1 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
                title="Confirmar"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                title="Cancelar"
                disabled={isSaving}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- UPGRADE: Feedback visual de nota guardada --- */}
        {isSaved && !hayCambio && !isSaving && rol !== "profesor" && (
          <Check className="w-4 h-4 text-green-400" title="Guardado" />
        )}
      </div>
    </td>
  );
};

// --- Funciones de Cálculo (sin cambios) ---
const calcularPromedioFinal = (n1, n2, n3) => {
  const notas = [n1, n2, n3]
    .map((n) => (n === null || n === undefined ? null : Number(n)))
    .filter((n) => n !== null);
  if (notas.length < 3) return null;
  const sum = notas.reduce((a, b) => a + b, 0);
  return sum / 3;
};
const getEstadoFinal = (promedio) => {
  if (promedio === null || promedio === undefined) return "-";
  return promedio >= 6 ? "Aprobado" : "Recuperacion";
};

// --- Componente Principal ---
const CargarNotas = ({ materiaIdProp }) => {
  const { token, usuario } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState("1");
  const [allNotes, setAllNotes] = useState({ 1: {}, 2: {}, 3: {} });
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  // --- UPGRADE: Estado para el filtro de búsqueda ---
  const [filtroNombre, setFiltroNombre] = useState("");

  // ... (useEffect de Carga de Datos sin cambios) ...
  useEffect(() => {
    const fetchAlumnosYNotas = async () => {
      if (!materiaIdProp || !token) {
        setAlumnos([]);
        setAllNotes({ 1: {}, 2: {}, 3: {} });
        return;
      }
      setLoadingAlumnos(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const resAlumnosPromise = axios.get(
          `http://localhost:5000/api/materias/${materiaIdProp}/alumnos`,
          { headers }
        );
        const resNotasT1Promise = axios.get(
          `http://localhost:5000/api/notas/materia/${materiaIdProp}?trimestre=1`,
          { headers }
        );
        const resNotasT2Promise = axios.get(
          `http://localhost:5000/api/notas/materia/${materiaIdProp}?trimestre=2`,
          { headers }
        );
        const resNotasT3Promise = axios.get(
          `http://localhost:5000/api/notas/materia/${materiaIdProp}?trimestre=3`,
          { headers }
        );
        const [resAlumnos, resNotasT1, resNotasT2, resNotasT3] =
          await Promise.all([
            resAlumnosPromise,
            resNotasT1Promise,
            resNotasT2Promise,
            resNotasT3Promise,
          ]);
        setAlumnos(resAlumnos.data || []);
        setAllNotes({
          1: resNotasT1.data || {},
          2: resNotasT2.data || {},
          3: resNotasT3.data || {},
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Error al obtener los datos de la materia.");
        setAlumnos([]);
        setAllNotes({ 1: {}, 2: {}, 3: {} });
      } finally {
        setLoadingAlumnos(false);
      }
    };
    fetchAlumnosYNotas();
  }, [materiaIdProp, token]);

  // ... (Callback handleNotaGuardada sin cambios) ...
  const handleNotaGuardada = (trimestre, alumnoId, notaActualizada) => {
    setAllNotes((prev) => ({
      ...prev,
      [trimestre]: {
        ...prev[trimestre],
        [alumnoId]: notaActualizada,
      },
    }));
  };

  const notasTrimestreActual = allNotes[trimestreSeleccionado] || {};

  // ... (Loader de usuario sin cambios) ...
  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-64 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 mr-3" />
        Cargando información de usuario...
      </div>
    );
  }

  const rolUsuario = usuario.rol;

  // --- UPGRADE: Lógica de filtrado de alumnos ---
  const filteredAlumnos = alumnos.filter((alumno) =>
    alumno.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  return (
    // --- UPGRADE: Contenedor tipo "Card" ---
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* --- UPGRADE: Cabecera del Panel --- */}
      <div className="p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Título y Selector de Trimestre */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <GraduationCap className="w-6 h-6 mr-2 text-sky-600" />
            Gestión de Calificaciones
          </h2>
          <TrimestreSelector
            value={trimestreSeleccionado}
            onChange={setTrimestreSeleccionado}
          />
        </div>

        {/* --- UPGRADE: Filtro de Búsqueda Interactivo --- */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar alumno por nombre..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* --- Contenido Dinámico --- */}
      <div>
        {loadingAlumnos ? (
          <SkeletonLoader />
        ) : alumnos.length > 0 ? (
          // --- UPGRADE: Mostrar EmptyState si el filtro no devuelve nada ---
          filteredAlumnos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-20">
                  {/* --- UPGRADE: Thead pegajoso --- */}
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[250px]"
                    >
                      Alumno
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28"
                    >
                      Orientadora (15%)
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28"
                    >
                      Proceso (25%)
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-bold text-sky-700 uppercase w-28 bg-sky-50"
                    >
                      Integradora (60%)
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase w-28 bg-gray-100"
                    >
                      Prom. Ponderado
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28"
                    >
                      Recuperación
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-bold text-blue-800 uppercase w-28 bg-blue-50"
                    >
                      Nota Final (Trim.)
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-bold text-indigo-800 uppercase w-28 bg-indigo-50 border-l"
                    >
                      Prom. Final (Anual)
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-center text-xs font-bold text-indigo-800 uppercase w-32 bg-indigo-50"
                    >
                      Estado Final
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* --- UPGRADE: Mapear sobre 'filteredAlumnos' --- */}
                  {filteredAlumnos.map((alumno) => {
                    const notasTrimestre =
                      notasTrimestreActual[alumno._id] || {};
                    const n1 = allNotes[1][alumno._id]?.notaFinalTrimestre;
                    const n2 = allNotes[2][alumno._id]?.notaFinalTrimestre;
                    const n3 = allNotes[3][alumno._id]?.notaFinalTrimestre;
                    const promFinalAnual = calcularPromedioFinal(n1, n2, n3);
                    const estadoFinalAnual = getEstadoFinal(promFinalAnual);

                    return (
                      <tr key={alumno._id} className="hover:bg-gray-50">
                        {/* Celda Alumno */}
                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white hover:bg-gray-50 z-10 border-r">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                alumno.nombre
                              )}&background=random&color=fff`} // --- UPGRADE: color=fff para mejor contraste
                              alt="Avatar"
                            />
                            <div className="ml-4 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {alumno.nombre}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {alumno.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Celdas NotaInput */}
                        <NotaInput
                          alumnoId={alumno._id}
                          materiaId={materiaIdProp}
                          trimestre={trimestreSeleccionado}
                          token={token}
                          rol={rolUsuario}
                          tipoNota="orientadora"
                          valorInicial={notasTrimestre.orientadora}
                          onNotaGuardada={handleNotaGuardada}
                        />
                        <NotaInput
                          alumnoId={alumno._id}
                          materiaId={materiaIdProp}
                          trimestre={trimestreSeleccionado}
                          token={token}
                          rol={rolUsuario}
                          tipoNota="proceso"
                          valorInicial={notasTrimestre.proceso}
                          onNotaGuardada={handleNotaGuardada}
                        />
                        <NotaInput
                          alumnoId={alumno._id}
                          materiaId={materiaIdProp}
                          trimestre={trimestreSeleccionado}
                          token={token}
                          rol={rolUsuario}
                          tipoNota="integradora"
                          valorInicial={notasTrimestre.integradora}
                          onNotaGuardada={handleNotaGuardada}
                        />

                        {/* Celdas Calculadas (Trimestral) */}
                        <PromedioCell
                          valor={notasTrimestre.promedioPonderado}
                        />
                        <NotaInput
                          alumnoId={alumno._id}
                          materiaId={materiaIdProp}
                          trimestre={trimestreSeleccionado}
                          token={token}
                          rol={rolUsuario}
                          tipoNota="recuperacion"
                          valorInicial={notasTrimestre.recuperacion}
                          onNotaGuardada={handleNotaGuardada}
                        />
                        <PromedioCell
                          valor={notasTrimestre.notaFinalTrimestre}
                        />

                        {/* Celdas Calculadas (Anual) */}
                        <PromedioCell valor={promFinalAnual} />
                        <EstadoFinalCell estado={estadoFinalAnual} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState message="No se encontraron alumnos con ese nombre" />
            </div>
          )
        ) : materiaIdProp ? (
          <div className="p-6">
            <EmptyState message="No se encontraron alumnos para esta materia" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CargarNotas;