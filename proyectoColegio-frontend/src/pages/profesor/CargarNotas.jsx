import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { GraduationCap, Frown, Loader2, Check } from "lucide-react";

import { 
  getAlumnosDeMateria, 
  getNotasDeMateria, 
  guardarNota 
} from "../../api/api";

// --- Componente para Input de Nota ---
const NotaInput = ({ 
  alumnoId, 
  materiaId, 
  trimestre, 
  tipoNota, 
  valorInicial, 
  rol, 
  onNotaGuardada 
}) => {
  const [valorLocal, setValorLocal] = useState(valorInicial ?? "");
  const [isSaving, setIsSaving] = useState(false);
  
  const valorInicialStr = valorInicial !== null && valorInicial !== undefined ? String(valorInicial) : "";
  const valorLocalStr = String(valorLocal);
  const hayCambio = valorLocalStr !== valorInicialStr;
  
  // Solo deshabilitar si está guardando
  const isDisabled = isSaving;

  // Actualizar valor local cuando cambia el valor inicial
  useEffect(() => {
    setValorLocal(valorInicial ?? "");
  }, [valorInicial]);

  const handleConfirmSave = async () => {
    if (!hayCambio || isSaving) return;
    
    // Validar nota
    if (valorLocal !== "") {
      const notaNum = Number(valorLocal);
      if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
        return toast.error("Nota inválida (debe estar entre 0 y 10)");
      }
    }

    setIsSaving(true);
    try {
      const notaParaEnviar = valorLocal === "" ? null : Number(valorLocal);
      
      const res = await guardarNota({
        materiaId, 
        alumnoId, 
        trimestre, 
        tipoNota, 
        nota: notaParaEnviar,
      });
      
      // Actualizar estado padre con la nota devuelta por el backend
      onNotaGuardada(trimestre, alumnoId, tipoNota, res.data.nota);
      toast.success("Nota guardada correctamente");
    } catch (err) {
      console.error("Error al guardar nota:", err);
      toast.error(err.response?.data?.msg || "Error al guardar la nota");
      // Revertir al valor inicial
      setValorLocal(valorInicial ?? "");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <td className="px-2 py-4 text-center">
      <div className="flex items-center justify-center gap-1">
        <input
          type="number" 
          min="0" 
          max="10" 
          step="0.01" 
          placeholder="-"
          className={`w-16 p-1 text-center border rounded ${
            hayCambio ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          value={valorLocal}
          onChange={(e) => setValorLocal(e.target.value)}
          disabled={isDisabled}
        />
        {hayCambio && !isDisabled && (
          <button 
            onClick={handleConfirmSave} 
            disabled={isSaving} 
            className="text-green-600 hover:bg-green-100 p-1 rounded disabled:opacity-50"
            title="Guardar nota"
          >
            {isSaving ? (
              <Loader2 className="animate-spin w-4 h-4"/>
            ) : (
              <Check className="w-4 h-4"/>
            )}
          </button>
        )}
      </div>
    </td>
  );
};

// --- Componente para mostrar Promedio ---
const PromedioCell = ({ valor }) => {
  const valorNum = valor !== null && valor !== undefined ? Number(valor) : null;
  
  return (
    <td className={`px-4 py-4 text-center font-bold text-sm ${
      valorNum === null 
        ? 'text-gray-400' 
        : valorNum >= 6 
        ? 'text-green-600' 
        : 'text-red-600'
    }`}>
      {valorNum !== null ? valorNum.toFixed(2) : '-'}
    </td>
  );
};

// --- Componente Principal ---
const CargarNotas = ({ materiaIdProp }) => {
  const { usuario } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [trimestre, setTrimestre] = useState("1");
  const [allNotes, setAllNotes] = useState({
    "1": {},
    "2": {},
    "3": {}
  });
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      if (!materiaIdProp) {
        console.warn("No se proporcionó materiaIdProp");
        return;
      }
      
      setLoading(true);
      try {
        // Carga paralela de alumnos y notas de todos los trimestres
        const [resAlumnos, resT1, resT2, resT3] = await Promise.all([
          getAlumnosDeMateria(materiaIdProp),
          getNotasDeMateria(materiaIdProp, "1"),
          getNotasDeMateria(materiaIdProp, "2"),
          getNotasDeMateria(materiaIdProp, "3"),
        ]);

        setAlumnos(resAlumnos.data || []);
        setAllNotes({
          "1": resT1.data || {},
          "2": resT2.data || {},
          "3": resT3.data || {},
        });
      } catch (err) {
        console.error("Error cargando datos:", err);
        toast.error(err.response?.data?.msg || "Error cargando datos de notas");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [materiaIdProp]);

  // Callback cuando se guarda una nota
  const handleNotaGuardada = (tri, alumnoId, tipoNota, notaCompleta) => {
    setAllNotes(prev => ({
      ...prev,
      [tri]: {
        ...prev[tri],
        [alumnoId]: notaCompleta // El backend devuelve el objeto completo con todos los cálculos
      }
    }));
  };

  // Estados de carga y sin datos
  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600"/>
        <span className="ml-2 text-gray-600">Cargando notas...</span>
      </div>
    );
  }

  if (alumnos.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Frown className="mx-auto mb-2 w-12 h-12"/>
        <p className="text-lg">No hay alumnos inscritos en esta materia.</p>
      </div>
    );
  }

  const notasTrim = allNotes[trimestre] || {};

  return (
    <div className="w-full">
      {/* Header con selector de trimestre */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <GraduationCap className="w-6 h-6"/> 
          Planilla de Notas
        </h3>
        <select 
          value={trimestre} 
          onChange={(e) => setTrimestre(e.target.value)} 
          className="p-2 border rounded bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1">1° Trimestre</option>
          <option value="2">2° Trimestre</option>
          <option value="3">3° Trimestre</option>
        </select>
      </div>

      {/* Tabla de notas */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500">
                Alumno
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase text-gray-500">
                Orientadora
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase text-gray-500">
                Proceso
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase text-gray-500">
                Integradora
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase text-gray-700 bg-gray-200">
                Promedio
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase text-gray-500">
                Recuperación
              </th>
              <th className="px-2 py-3 text-center text-xs font-bold uppercase text-blue-700 bg-blue-50">
                Final
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alumnos.map(alumno => {
              const notas = notasTrim[alumno._id] || {};
              
              return (
                <tr key={alumno._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {alumno.nombre}
                  </td>
                  
                  <NotaInput 
                    alumnoId={alumno._id} 
                    materiaId={materiaIdProp} 
                    trimestre={trimestre} 
                    tipoNota="orientadora" 
                    valorInicial={notas.orientadora} 
                    rol={usuario?.rol} 
                    onNotaGuardada={handleNotaGuardada} 
                  />
                  
                  <NotaInput 
                    alumnoId={alumno._id} 
                    materiaId={materiaIdProp} 
                    trimestre={trimestre} 
                    tipoNota="proceso" 
                    valorInicial={notas.proceso} 
                    rol={usuario?.rol} 
                    onNotaGuardada={handleNotaGuardada} 
                  />
                  
                  <NotaInput 
                    alumnoId={alumno._id} 
                    materiaId={materiaIdProp} 
                    trimestre={trimestre} 
                    tipoNota="integradora" 
                    valorInicial={notas.integradora} 
                    rol={usuario?.rol} 
                    onNotaGuardada={handleNotaGuardada} 
                  />
                  
                  <PromedioCell valor={notas.promedioPonderado} />
                  
                  <NotaInput 
                    alumnoId={alumno._id} 
                    materiaId={materiaIdProp} 
                    trimestre={trimestre} 
                    tipoNota="recuperacion" 
                    valorInicial={notas.recuperacion} 
                    rol={usuario?.rol} 
                    onNotaGuardada={handleNotaGuardada} 
                  />
                  
                  <PromedioCell valor={notas.notaFinalTrimestre} />
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