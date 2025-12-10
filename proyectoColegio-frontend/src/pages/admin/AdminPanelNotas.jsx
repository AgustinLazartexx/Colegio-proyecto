import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { 
  History, 
  Loader2, 
  FileSignature, 
  User, 
  ArrowRight, 
  CalendarClock, 
  AlertTriangle 
} from "lucide-react";

// Helper para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Helper para nombres amigables de campos
const formatFieldName = (field) => {
  const map = {
    orientadora: "Nota Orientadora",
    proceso: "Nota de Proceso",
    integradora: "Nota Integradora",
    recuperacion: "Recuperatorio"
  };
  return map[field] || field;
};

const AdminAuditoriaNotas = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditoria = async () => {
      setLoading(true);
      try {
        // Asegúrate de que la URL coincida con tu backend o usa tu instancia de api.js
        const res = await axios.get("http://localhost:5000/api/notas/auditoria", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar el historial de cambios.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditoria();
  }, [token]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-full max-h-[600px]"> 
      {/* HEADER */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
               <History className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Auditoría de Notas</h2>
              <p className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                Monitoreo de cambios manuales
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-3xl font-bold text-gray-800">{logs.length}</span>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Registros</p>
          </div>
        </div>
      </div>

      {/* CONTENIDO SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-40 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500 font-medium">Consultando registros...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
                <History size={32} />
            </div>
            <p>No se han registrado modificaciones manuales.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log._id} 
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Decoración lateral */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 group-hover:bg-amber-500 transition-colors"></div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                
                {/* 1. INFO DEL ACTOR Y ALUMNO */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <User size={12} /> ADMIN
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                        {log.modificadoPor?.nombre || "Usuario Desconocido"}
                    </span>
                    <span className="text-gray-400 text-xs">modificó a</span>
                  </div>

                  <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <GraduationCapIcon /> 
                    {log.alumno?.nombre || "Alumno Eliminado"}
                  </h3>
                  
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                     <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">
                        {log.trimestre}° Trimestre
                     </span>
                     <span>•</span>
                     <span className="capitalize">{formatFieldName(log.campoModificado)}</span>
                  </div>
                </div>

                {/* 2. EL CAMBIO (VALOR) */}
                <div className="flex flex-col items-end min-w-[140px]">
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="text-center">
                        <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Antes</span>
                        <span className="text-red-500 font-mono font-bold text-lg line-through opacity-70">
                            {log.valorAnterior ?? "-"}
                        </span>
                    </div>
                    
                    <ArrowRight className="text-gray-300" size={20} />

                    <div className="text-center">
                        <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Ahora</span>
                        <span className="text-green-600 font-mono font-bold text-xl">
                            {log.valorNuevo ?? "-"}
                        </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <CalendarClock size={12} />
                    {formatDate(log.createdAt)}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Pequeño componente ícono para mantener limpio el principal
const GraduationCapIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="text-indigo-500"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
);

export default AdminAuditoriaNotas;