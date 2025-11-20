import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Check, Info, Frown } from "lucide-react";
import { getAlumnosDeMateria, getNotasDeMateria, guardarNota } from "../../api/api";

// --- Componente Input Individual (Sin cambios mayores, solo estética) ---
const NotaInput = ({ alumnoId, materiaId, trimestre, tipoNota, valorInicial, onNotaGuardada }) => {
  const [valorLocal, setValorLocal] = useState(valorInicial ?? "");
  const [isSaving, setIsSaving] = useState(false);
  
  const valorInicialStr = valorInicial !== null && valorInicial !== undefined ? String(valorInicial) : "";
  const hayCambio = String(valorLocal) !== valorInicialStr;

  useEffect(() => {
    setValorLocal(valorInicial ?? "");
  }, [valorInicial]);

  const handleSave = async () => {
    if (!hayCambio || isSaving) return;
    
    // Validación básica
    if (valorLocal !== "") {
      const num = Number(valorLocal);
      if (num < 1 || num > 10) return toast.warning("Nota entre 1 y 10");
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

      // Actualizamos el estado global en el padre para que se recalcule el promedio si el back lo devuelve
      onNotaGuardada(trimestre, alumnoId, tipoNota, res.data.nota); 
      toast.success("Guardado", { autoClose: 1000, position: "bottom-right" });
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
      setValorLocal(valorInicial ?? ""); // Revertir en error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center">
      <input 
        type="number" 
        className={`w-16 text-center border rounded py-1 text-sm transition-all outline-none 
            ${hayCambio ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-300'}
            focus:border-blue-500 focus:ring-2 focus:ring-blue-200
        `}
        placeholder="-"
        min="1" max="10"
        value={valorLocal}
        onChange={(e) => setValorLocal(e.target.value)}
        onBlur={handleSave} // Guardar al salir del input
        onKeyDown={(e) => e.key === 'Enter' && handleSave()} // Guardar al dar Enter
        disabled={isSaving}
      />
      {isSaving && <Loader2 className="absolute -right-5 w-4 h-4 animate-spin text-blue-500" />}
    </div>
  );
};

// --- Componente Celda Promedio ---
const PromedioCell = ({ valor }) => {
    const num = valor ? Number(valor) : null;
    if (num === null) return <span className="text-gray-300">-</span>;
    
    const aprobado = num >= 6;
    return (
        <span className={`font-bold px-2 py-1 rounded text-sm ${aprobado ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
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

  // 1. Cargar Alumnos y Notas cuando cambia la materia
  useEffect(() => {
    if (!materiaId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // A. Obtener Alumnos de la Materia
        const resAlumnos = await getAlumnosDeMateria(materiaId);
        setAlumnos(resAlumnos.data || []);

        // B. Obtener Notas de los 3 trimestres
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

  // Función para actualizar estado local tras guardar en DB
  const handleNotaLocalUpdate = (tri, alumnoId, tipo, notaObj) => {
     setNotasData(prev => ({
         ...prev,
         [tri]: {
             ...prev[tri],
             [alumnoId]: notaObj // notaObj debería venir del backend con { orientadora: X, promedio: Y ... } actualizados
         }
     }));
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando alumnos y notas...</div>;

  if (alumnos.length === 0) {
    return (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
            <Frown className="mx-auto h-10 w-10 text-gray-400 mb-2"/>
            <h3 className="text-lg font-medium text-gray-900">Sin alumnos inscritos</h3>
            <p className="text-gray-500">No hay alumnos en esta materia actualmente.</p>
        </div>
    );
  }

  const notasDelTrimestre = notasData[trimestre] || {};

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Barra de Controles de la Tabla */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="font-bold text-lg text-gray-800">{materiaNombre}</h2>
            <p className="text-xs text-gray-500">{anio}° "{division}" - Listado de {alumnos.length} alumnos</p>
        </div>
        
        {/* Selector Trimestre */}
        <div className="flex bg-white rounded-lg border border-gray-300 p-1 shadow-sm">
            {["1", "2", "3"].map(t => (
                <button 
                    key={t}
                    onClick={() => setTrimestre(t)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        trimestre === t ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    {t}° Trimestre
                </button>
            ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-64 sticky left-0 bg-gray-100 z-10">Alumno</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase">Orient.</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase">Proceso</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase">Integr.</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200">Promedio</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-red-600 uppercase">Recup.</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-blue-700 uppercase bg-blue-50 border-l">Final</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
                {alumnos.map((alumno, idx) => {
                    const notasAlumno = notasDelTrimestre[alumno._id] || {};
                    
                    return (
                        <tr key={alumno._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50 hover:bg-blue-50/20'}>
                            <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-inherit z-10">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-3">
                                        {alumno.apellido?.charAt(0)}{alumno.nombre?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{alumno.apellido}, {alumno.nombre}</div>
                                    </div>
                                </div>
                            </td>

                            {/* Inputs de Notas */}
                            <td className="px-2 py-3 text-center">
                                <NotaInput 
                                    alumnoId={alumno._id} materiaId={materiaId} trimestre={trimestre}
                                    tipoNota="orientadora" valorInicial={notasAlumno.orientadora}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>
                            <td className="px-2 py-3 text-center">
                                <NotaInput 
                                    alumnoId={alumno._id} materiaId={materiaId} trimestre={trimestre}
                                    tipoNota="proceso" valorInicial={notasAlumno.proceso}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>
                            <td className="px-2 py-3 text-center">
                                <NotaInput 
                                    alumnoId={alumno._id} materiaId={materiaId} trimestre={trimestre}
                                    tipoNota="integradora" valorInicial={notasAlumno.integradora}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>

                            {/* Promedio Calculado */}
                            <td className="px-2 py-3 text-center bg-gray-50 font-mono">
                                <PromedioCell valor={notasAlumno.promedioPonderado} />
                            </td>

                            {/* Recuperación */}
                            <td className="px-2 py-3 text-center border-l border-gray-100">
                                <NotaInput 
                                    alumnoId={alumno._id} materiaId={materiaId} trimestre={trimestre}
                                    tipoNota="recuperacion" valorInicial={notasAlumno.recuperacion}
                                    onNotaGuardada={handleNotaLocalUpdate}
                                />
                            </td>

                            {/* Nota Final */}
                            <td className="px-2 py-3 text-center bg-blue-50/30 border-l border-blue-100 font-mono">
                                <PromedioCell valor={notasAlumno.notaFinalTrimestre} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default CargarNotas;