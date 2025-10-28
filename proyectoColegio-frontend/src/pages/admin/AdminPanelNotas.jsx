// src/pages/admin/AdminAuditoriaNotas.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { History, Loader2 } from "lucide-react";

const AdminAuditoriaNotas = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditoria = async () => {
      setLoading(true);
      try {
        // Llama al nuevo endpoint de auditoría
        const res = await axios.get("http://localhost:5000/api/notas/auditoria", {
          headers: { Authorization: `Bearer ${token}` },
          // Opcional: filtrar por materia/trimestre
          // params: { materiaId: '...', trimestre: '...' } 
        });
        setLogs(res.data);
      } catch (err) {
        toast.error("Error al cargar el historial de cambios.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditoria();
  }, [token]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-800">Historial de Modificaciones (Alerta)</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Registros de notas modificadas manualmente por administradores.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : logs.length === 0 ? (
        <p className="p-6 text-center text-gray-500">No hay modificaciones registradas.</p>
      ) : (
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800">{log.alumno?.nombre || "Alumno Eliminado"}</span>
                <span className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-yellow-800">{log.modificadoPor?.nombre || "Admin"}</span>
                {" cambió "}
                <span className="font-semibold text-blue-600">{log.campoModificado}</span>
                {" del Trimestre "}
                <span className="font-semibold">{log.trimestre}</span>
                {": "}
                <span className="font-semibold text-red-600 line-through">{log.valorAnterior || 'Vacío'}</span>
                {" → "}
                <span className="font-semibold text-green-600">{log.valorNuevo || 'Vacío'}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAuditoriaNotas;