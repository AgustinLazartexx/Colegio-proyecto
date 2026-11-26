import { useState } from "react";
import { CheckCircle2, Loader2, Paperclip, Send } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const EntregarTarea = ({ tareaId, alumnoId, onSuccess }) => {
  const { usuario } = useAuth();
  const [archivo, setArchivo] = useState(null);
  const [comentario, setComentario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolvedAlumnoId = alumnoId || usuario?._id || usuario?.id || "";

  const handleArchivoChange = (event) => {
    setArchivo(event.target.files?.[0] || null);
    setMensaje("");
    setEsError(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!archivo) {
      setEsError(true);
      setMensaje("Selecciona un archivo antes de enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("comentario", comentario);
    formData.append("tarea", tareaId);
    if (resolvedAlumnoId) {
      formData.append("alumno", resolvedAlumnoId);
    }

    try {
      setLoading(true);
      setMensaje("");
      setEsError(false);
      await api.post("/entregas", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMensaje("Entrega enviada correctamente.");
      setComentario("");
      setArchivo(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error al enviar tarea:", error);
      setEsError(true);
      setMensaje(error.response?.data?.msg || "Error al enviar la entrega.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-canvas/70 p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">
          Comentario (opcional)
        </label>
        <textarea
          rows={2}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          placeholder="Agrega una nota o consulta para el docente..."
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-secondary">
          <Paperclip size={15} className="shrink-0" />
          <span className="truncate max-w-[240px]">
            {archivo ? archivo.name : "Adjuntar archivo"}
          </span>
          <input type="file" onChange={handleArchivoChange} className="sr-only" />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {loading ? "Enviando..." : "Entregar tarea"}
        </button>
      </div>

      {mensaje && (
        <p
          role={esError ? "alert" : "status"}
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            esError ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {!esError && <CheckCircle2 size={14} />}
          {mensaje}
        </p>
      )}
    </form>
  );
};

export default EntregarTarea;
