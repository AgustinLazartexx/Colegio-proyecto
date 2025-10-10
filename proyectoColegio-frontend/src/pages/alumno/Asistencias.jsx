// src/pages/alumno/Asistencias.jsx
import { CalendarCheck } from "lucide-react";

const asistenciaSimulada = [
  { fecha: "2025-06-17", estado: "Presente" },
  { fecha: "2025-06-18", estado: "Ausente" },
  { fecha: "2025-06-19", estado: "Presente" },
];

const Asistencias = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-accent mb-6">Asistencia</h1>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-200 text-sm text-gray-700">
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {asistenciaSimulada.map((a, index) => (
            <tr key={index} className="border-b">
              <td className="px-4 py-2">{a.fecha}</td>
              <td
                className={`px-4 py-2 font-medium ${
                  a.estado === "Presente"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {a.estado}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Asistencias;
