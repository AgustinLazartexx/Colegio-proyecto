import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Save, Check, Frown, AlertCircle, TrendingUp, Award } from "lucide-react";
import { getAlumnosDeMateria, getNotasDeMateria, guardarNota } from "../../api/api";

// --- Componente Input Individual con Botón de Guardado ---
const NotaInput = ({ alumnoId, materiaId, trimestre, tipoNota, valorInicial, onNotaGuardada }) => {
  const [valorLocal, setValorLocal] = useState(valorInicial ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  const valorInicialStr = valorInicial !== null && valorInicial !== undefined ? String(valorInicial) : "";
  const hayCambio = String(valorLocal) !== valorInicialStr;

  useEffect(() => {
    setValorLocal(valorInicial ?? "");
    setJustSaved(false);
  }, [valorInicial]);

  const handleSave = async () => {
    if (!hayCambio || isSaving) return;
    
    // Validación básica
    if (valorLocal !== "") {
      const num = Number(valorLocal);
      if (num < 1 || num > 10) {
        toast.warning("La nota debe estar entre 1 y 10", { autoClose: 2000 });
        return;
      }
    }

    setIsSaving(true);
    try {
      const notaEnviar = valorLocal === "" ? null : Number(valorLocal);
      
      const res = await guardarNota({
        materiaId,
        alumnoId,
        trimestre,
        tipoNota,
        nota: notaEnviar
      });

      onNotaGuardada(trimestre, alumnoId, tipoNota, res.data.nota); 
      setJustSaved(true);
      toast.success("Nota guardada exitosamente", { autoClose: 1500, position: "bottom-right" });
      
      // Quitar el indicador de guardado después de 2 segundos
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la nota");
      setValorLocal(valorInicial ?? "");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <input 
        type="number" 
        className={`w-16 text-center border-2 rounded-lg py-2 text-sm font-medium transition-all outline-none 
            ${hayCambio ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200'}
            ${justSaved ? 'border-green-400 bg-green-50' : ''}
            focus:border-blue-500 focus:ring-2 focus:ring-blue-200
            disabled:bg-gray-50 disabled:cursor-not-allowed
        `}
        placeholder="-"
        min="1" 
        max="10"
        step="0.01"
        value={valorLocal}
        onChange={(e) => setValorLocal(e.target.value)}
        disabled={isSaving}
      />
      
      {hayCambio && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
          title="Guardar nota"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>
      )}
      
      {justSaved && !hayCambio && (
        <div className="p-2 rounded-lg bg-green-100 text-green-600 animate-pulse">
          <Check className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

// --- Componente Celda Promedio ---
const PromedioCell = ({ valor }) => {
    const num = valor ? Number(valor) : null;
    if (num === null) return <span className="text-gray-300 font-medium">-</span>;
    
    const aprobado = num >= 6;
    return (
        <span className={`font-bold px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5 ${
          aprobado 
            ? 'text-green-700 bg-green-100 border border-green-200' 
            : 'text-red-700 bg-red-100 border border-red-200'
        }`}>
            {aprobado ? <TrendingUp className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {num.toFixed(2)}
        </span>
    );
};

// --- Componente Principal de la Tabla ---
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
        setAlumnos(resAlumnos.data || []);

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
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar planilla de notas");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [materiaId]);

  const handleNotaLocalUpdate = (tri, alumnoId, tipo, notaObj) => {
     setNotasData(prev => ({
         ...prev,
         [tri]: {
             ...prev[tri],
             [alumnoId]: notaObj
         }
     }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Cargando planilla de notas...</p>
        <p className="text-gray-400 text-sm mt-1">Por favor espera un momento</p>
      </div>
    );
  }

  if (alumnos.length === 0) {
    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 rounded-2xl border-2 border-dashed border-gray-300 text-center shadow-inner">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <Frown className="w-10 h-10 text-gray-400"/>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sin alumnos inscritos</h3>
            <p className="text-gray-500">No hay alumnos registrados en esta materia actualmente.</p>
        </div>
    );
  }

  const notasDelTrimestre = notasData[trimestre] || {};

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Barra de Controles Superior */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 px-6 py-5 border-b-2 border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-900 mb-1">{materiaNombre}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="bg-white px-3 py-1 rounded-full font-medium border border-gray-200">
                  {anio}° Año - División "{division}"
                </span>
                <span className="text-gray-400">•</span>
                <span className="font-medium">{alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Selector de Trimestre Mejorado */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trimestre</span>
            <div className="flex bg-white rounded-xl border-2 border-gray-200 p-1 shadow-md">
                {["1", "2", "3"].map(t => (
                    <button 
                        key={t}
                        onClick={() => setTrimestre(t)}
                        className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                            trimestre === t 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {t}° Trim.
                    </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Información de Ayuda */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">Ingresa las notas y presiona el botón <Save className="w-3.5 h-3.5 inline" /> para guardar cada calificación.</span>
        </div>
      </div>

      {/* Tabla de Notas */}
      <div className="overflow-x-auto">
        <table className="w-full">
            <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-72 sticky left-0 bg-gray-100 z-20 shadow-sm">
                      Alumno
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                      <div>Orientadora</div>
                      <div className="text-[10px] text-gray-500 font-normal mt-0.5">15%</div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                      <div>Proceso</div>
                      <div className="text-[10px] text-gray-500 font-normal mt-0.5">25%</div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                      <div>Integradora</div>
                      <div className="text-[10px] text-gray-500 font-normal mt-0.5">60%</div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border-l-2 border-indigo-200">
                      Promedio
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-orange-700 uppercase tracking-wider bg-orange-50 border-l-2 border-orange-200">
                      Recuperación
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border-l-2 border-emerald-200">
                      Nota Final
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {alumnos.map((alumno, idx) => {
                    const notasAlumno = notasDelTrimestre[alumno._id] || {};
                    
                    return (
                        <tr 
                          key={alumno._id} 
                          className={`transition-colors ${
                            idx % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/50 hover:bg-blue-50/40'
                          }`}
                        >
                            <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-inherit z-10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                                        {alumno.apellido?.charAt(0)}{alumno.nombre?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                          {alumno.apellido}, {alumno.nombre}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Legajo: {alumno.legajo || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* Inputs de Notas con Botones */}
                            <td className="px-4 py-4 text-center border-l border-gray-100">
                                <NotaInput 
                                    alumnoId={alumno._id} 
                                    materiaId={materiaId} 
                                    trimestre={trimestre}
                                    tipoNota="orientadora" 
                                    valorInicial={notasAlumno.orientadora}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>
                            <td className="px-4 py-4 text-center border-l border-gray-100">
                                <NotaInput 
                                    alumnoId={alumno._id} 
                                    materiaId={materiaId} 
                                    trimestre={trimestre}
                                    tipoNota="proceso" 
                                    valorInicial={notasAlumno.proceso}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>
                            <td className="px-4 py-4 text-center border-l border-gray-100">
                                <NotaInput 
                                    alumnoId={alumno._id} 
                                    materiaId={materiaId} 
                                    trimestre={trimestre}
                                    tipoNota="integradora" 
                                    valorInicial={notasAlumno.integradora}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>

                            {/* Promedio Calculado */}
                            <td className="px-4 py-4 text-center bg-indigo-50/50 font-mono border-l-2 border-indigo-100">
                                <PromedioCell valor={notasAlumno.promedioPonderado} />
                            </td>

                            {/* Recuperación */}
                            <td className="px-4 py-4 text-center bg-orange-50/30 border-l-2 border-orange-100">
                                <NotaInput 
                                    alumnoId={alumno._id} 
                                    materiaId={materiaId} 
                                    trimestre={trimestre}
                                    tipoNota="recuperacion" 
                                    valorInicial={notasAlumno.recuperacion}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>

                            {/* Nota Final */}
                            <td className="px-4 py-4 text-center bg-emerald-50/30 border-l-2 border-emerald-100 font-mono">
                                <PromedioCell valor={notasAlumno.notaFinalTrimestre} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      {/* Footer Informativo */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Aprobado ≥ 6.00</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Desaprobado &lt; 6.00</span>
            </div>
          </div>
          <span className="font-medium text-gray-500">
            Total: {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} en {trimestre}° Trimestre
          </span>
        </div>
      </div>
    </div>
  );
};

export default CargarNotas;