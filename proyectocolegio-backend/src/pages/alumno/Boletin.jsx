import React, { useEffect, useState } from "react";
import SidebarAlumno from "../../components/sidebar/SidebarAlumno";
import { getMisNotasAlumno } from "../../api/api";
import { Book, Award, AlertCircle } from "lucide-react";

const Boletin = () => {
  const [boletin, setBoletin] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarNotas = async () => {
      try {
        const res = await getMisNotasAlumno();
        // res.data.notas es el array plano que viene del backend
        const notasPlanas = res.data.notas || [];
        
        // Procesamos los datos para agruparlos por Materia
        const materiasMap = {};

        notasPlanas.forEach((nota) => {
          const idMateria = nota.materia?._id;
          const nombreMateria = nota.materia?.nombre || "Materia Desconocida";

          if (!materiasMap[idMateria]) {
            materiasMap[idMateria] = {
              nombre: nombreMateria,
              t1: null,
              t2: null,
              t3: null,
              promedioFinal: null // Aquí podrías calcular un promedio anual si quisieras
            };
          }

          // Asignamos la nota final de ese trimestre a la columna correspondiente
          // 'notaFinalTrimestre' es el campo que calcula tu backend (incluye recuperatorios)
          if (nota.trimestre === 1) materiasMap[idMateria].t1 = nota.notaFinalTrimestre;
          if (nota.trimestre === 2) materiasMap[idMateria].t2 = nota.notaFinalTrimestre;
          if (nota.trimestre === 3) materiasMap[idMateria].t3 = nota.notaFinalTrimestre;
        });

        setBoletin(Object.values(materiasMap));
      } catch (error) {
        console.error("Error al cargar boletín:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarNotas();
  }, []);

  // Función para pintar la nota de color (Rojo si desaprueba, Verde/Negro si aprueba)
  const renderNota = (valor) => {
    if (valor === null || valor === undefined) return <span className="text-gray-300">-</span>;
    const esDesaprobado = valor < 6; // Ajusta según tu criterio (ej. 6 o 7)
    return (
      <span className={`font-bold ${esDesaprobado ? "text-red-500" : "text-gray-800"}`}>
        {valor}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
     
      
      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="text-yellow-500" size={32} /> Mi Boletín Académico
          </h1>
          <p className="text-gray-600 mt-2">Resumen de calificaciones trimestrales.</p>
        </header>

        {loading ? (
          <div className="text-center p-10">Cargando notas...</div>
        ) : boletin.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500 flex flex-col items-center">
            <AlertCircle size={48} className="mb-4 text-blue-300"/>
            <p>Aún no tienes notas cargadas en el sistema.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="p-4 font-semibold"><div className="flex items-center gap-2"><Book size={18}/> Materia</div></th>
                    <th className="p-4 font-semibold text-center w-24">1º Trim</th>
                    <th className="p-4 font-semibold text-center w-24">2º Trim</th>
                    <th className="p-4 font-semibold text-center w-24">3º Trim</th>
                    <th className="p-4 font-semibold text-center w-32 bg-blue-700">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {boletin.map((mat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-700">{mat.nombre}</td>
                      <td className="p-4 text-center bg-gray-50/50">{renderNota(mat.t1)}</td>
                      <td className="p-4 text-center">{renderNota(mat.t2)}</td>
                      <td className="p-4 text-center bg-gray-50/50">{renderNota(mat.t3)}</td>
                      <td className="p-4 text-center font-bold bg-blue-50 text-blue-800">
                        {/* Cálculo simple de promedio anual visual (opcional) */}
                        {(() => {
                           const notas = [mat.t1, mat.t2, mat.t3].filter(n => n !== null);
                           if (notas.length === 0) return "-";
                           const prom = notas.reduce((a, b) => a + b, 0) / notas.length;
                           return prom.toFixed(2);
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Boletin;