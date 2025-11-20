import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Save, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { getAlumnosDeMateria, getNotasDeMateria, guardarNota } from "../../api/api";

// --- Componente Input de Nota Mejorado ---
const NotaInput = ({ alumnoId, materiaId, trimestre, tipoNota, valorInicial, onNotaGuardada }) => {
  const [valorLocal, setValorLocal] = useState(valorInicial ?? "");
  const [status, setStatus] = useState("idle"); // idle, editing, saving, success, error

  const valorInicialStr = valorInicial !== null && valorInicial !== undefined ? String(valorInicial) : "";
  // Detectar si hay cambios reales
  const hayCambio = String(valorLocal) !== valorInicialStr;

  useEffect(() => {
    setValorLocal(valorInicial ?? "");
    setStatus("idle");
  }, [valorInicial]);

  const handleSave = async () => {
    // Validación: Si no hay cambio o ya está guardando, no hacer nada
    if (!hayCambio || status === "saving") return;

    // Validación numérica
    if (valorLocal !== "") {
      const num = Number(valorLocal);
      if (isNaN(num) || num < 1 || num > 10) {
        setStatus("error");
        return toast.warn("La nota debe ser entre 1 y 10");
      }
    }

    setStatus("saving");
    try {
      const notaEnviar = valorLocal === "" ? null : Number(valorLocal);
      
      const res = await guardarNota({
        materiaId,
        alumnoId,
        trimestre,
        tipoNota,
        nota: notaEnviar
      });

      // Notificar al padre para actualizar promedios
      onNotaGuardada(trimestre, alumnoId, tipoNota, res.data.nota); 
      setStatus("success");
      
      // Volver a estado neutro después de unos segundos visuales
      setTimeout(() => setStatus("idle"), 2000);
      
    } catch (error) {
      console.error(error);
      setStatus("error");
      toast.error("No se pudo guardar. Intente nuevamente.");
    } finally {
      if (status !== "error") setStatus("idle");
    }
  };

  // Clases dinámicas según el estado
  const inputBaseClass = "w-16 text-center text-sm font-semibold rounded-md border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  let inputStateClass = "border-slate-200 focus:border-blue-500 focus:ring-blue-200 text-slate-700";
  if (status === "success") inputStateClass = "border-emerald-400 bg-emerald-50 text-emerald-700";
  if (status === "error") inputStateClass = "border-red-400 bg-red-50 text-red-700";
  if (hayCambio && status !== "saving") inputStateClass = "border-amber-300 bg-amber-50 ring-2 ring-amber-100"; // Indicador de "cambio sin guardar"

  return (
    <div className="relative flex items-center justify-center group">
      <input 
        type="number" 
        className={`${inputBaseClass} ${inputStateClass} py-1.5`}
        placeholder="-"
        min="1" max="10"
        step="0.01"
        value={valorLocal}
        onChange={(e) => {
            setValorLocal(e.target.value);
            if (status !== "editing") setStatus("editing");
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        onBlur={handleSave} // Auto-guardado al salir (opcional, pero recomendado)
        disabled={status === "saving"}
      />

      {/* Botón flotante explícito para guardar (aparece solo si hay cambios) */}
      {hayCambio && status !== "saving" && (
        <button 
          onClick={handleSave}
          className="absolute -right-8 p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 hover:scale-110 transition-all z-10"
          title="Guardar cambio"
        >
          <Save size={12} />
        </button>
      )}

      {/* Indicadores de estado */}
      {status === "saving" && <Loader2 className="absolute -right-6 w-4 h-4 animate-spin text-blue-500" />}
      {status === "success" && !hayCambio && <CheckCircle2 className="absolute -right-6 w-4 h-4 text-emerald-500 animate-in fade-in zoom-in duration-300" />}
      {status === "error" && <AlertCircle className="absolute -right-6 w-4 h-4 text-red-500" />}
    </div>
  );
};

// --- Celda de Promedio ---
const PromedioCell = ({ valor, esFinal = false }) => {
    const num = valor ? Number(valor) : null;
    if (num === null) return <span className="text-slate-300 text-lg">-</span>;
    
    const aprobado = num >= 6;
    const colorClass = aprobado 
        ? (esFinal ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "text-emerald-600") 
        : (esFinal ? "bg-red-100 text-red-800 border-red-200" : "text-red-600");

    return (
        <div className={`font-bold text-center py-1 px-3 rounded-lg border ${esFinal ? 'border shadow-sm' : 'border-transparent'} ${colorClass}`}>
            {num.toFixed(2)}
        </div>
    );
};

// --- Componente Principal ---
const CargarNotas = ({ materiaId, materiaNombre, anio, division }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [trimestre, setTrimestre] = useState("1");
  const [notasData, setNotasData] = useState({ "1": {}, "2": {}, "3": {} });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!materiaId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const resAlumnos = await getAlumnosDeMateria(materiaId);
        // Ordenar alumnos alfabéticamente
        const listaOrdenada = (resAlumnos.data || []).sort((a,b) => a.apellido.localeCompare(b.apellido));
        setAlumnos(listaOrdenada);

        const [t1, t2, t3] = await Promise.all([
            getNotasDeMateria(materiaId, "1"),
            getNotasDeMateria(materiaId, "2"),
            getNotasDeMateria(materiaId, "3")
        ]);

        setNotasData({
            "1": t1.data || {},
            "2": t2.data || {},
            "3": t3.data || {}
        });
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar la planilla.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [materiaId]);

  const handleNotaLocalUpdate = (tri, alumnoId, tipo, notaObj) => {
     setNotasData(prev => ({
         ...prev,
         [tri]: { ...prev[tri], [alumnoId]: notaObj }
     }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-500 font-medium">Cargando planilla de alumnos...</p>
    </div>
  );

  if (alumnos.length === 0) {
    return (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No hay alumnos inscritos</h3>
            <p className="text-slate-500 mt-2">Esta materia aún no tiene estudiantes asignados.</p>
        </div>
    );
  }

  const notasDelTrimestre = notasData[trimestre] || {};

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header de la Tabla */}
      <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {materiaNombre}
                <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                    {anio}° "{division}"
                </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">Planilla de Calificaciones ({alumnos.length} alumnos)</p>
        </div>
        
        {/* Tabs de Trimestres Mejorados */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            {["1", "2", "3"].map(t => (
                <button 
                    key={t}
                    onClick={() => setTrimestre(t)}
                    className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                        trimestre === t 
                        ? 'bg-blue-600 text-white shadow-md translate-y-[-1px]' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    {t}° Trimestre
                </button>
            ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full divide-y divide-slate-200">
            <thead>
                <tr className="bg-slate-100/80 text-slate-600 text-xs uppercase tracking-wider font-bold text-center">
                    <th className="px-6 py-4 text-left w-64 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Alumno
                    </th>
                    <th className="px-2 py-4">Orientadora</th>
                    <th className="px-2 py-4">Proceso</th>
                    <th className="px-2 py-4">Integradora</th>
                    <th className="px-2 py-4 bg-slate-200/50">Promedio</th>
                    <th className="px-2 py-4 text-amber-700 bg-amber-50/50 border-l border-amber-100">Recuperación</th>
                    <th className="px-2 py-4 text-blue-700 bg-blue-50/50 border-l border-blue-100">Nota Final</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
                {alumnos.map((alumno, idx) => {
                    const notas = notasDelTrimestre[alumno._id] || {};
                    return (
                        <tr key={alumno._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold mr-3 shadow-sm">
                                        {alumno.nombre.charAt(0)}{alumno.apellido?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{alumno.apellido}, {alumno.nombre}</div>
                                        <div className="text-xs text-slate-400">{alumno.dni || "Sin DNI"}</div>
                                    </div>
                                </div>
                            </td>

                            {/* Inputs de Notas */}
                            {["orientadora", "proceso", "integradora"].map((tipo) => (
                                <td key={tipo} className="px-2 py-3">
                                    <NotaInput 
                                        alumnoId={alumno._id} materiaId={materiaId} trimestre={trimestre}
                                        tipoNota={tipo} valorInicial={notas[tipo]}
                                        onNotaGuardada={handleNotaLocalUpdate}
                                    />
                                </td>
                            ))}

                            {/* Promedio */}
                            <td className="px-2 py-3 bg-slate-50">
                                <div className="flex justify-center">
                                    <PromedioCell valor={notas.promedioPonderado} />
                                </div>
                            </td>

                            {/* Recuperación */}
                            <td className="px-2 py-3 bg-amber-50/30 border-l border-amber-100">
                                <NotaInput 
                                    alumnoId={alumno._id} materiaId={materiaId} trimestre={trimestre}
                                    tipoNota="recuperacion" valorInicial={notas.recuperacion}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>

                            {/* Final */}
                            <td className="px-2 py-3 bg-blue-50/30 border-l border-blue-100">
                                <div className="flex justify-center">
                                    <PromedioCell valor={notas.notaFinalTrimestre} esFinal={true} />
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
    {/* Footer informativo de la tabla */}
    <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <div className="flex items-center gap-2">
             <Info size={14}/> <span>Presiona <b>Enter</b> o haz clic fuera de la casilla para guardar automáticamente.</span>
        </div>
        <div>
            Sistema de Gestión Escolar v2.0
        </div>
    </div>
    </div>
  );
};

export default CargarNotas;