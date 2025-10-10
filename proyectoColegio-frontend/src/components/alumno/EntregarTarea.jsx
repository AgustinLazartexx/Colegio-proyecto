import React, { useState } from "react";
import axios from "axios";

const EntregarTarea = ({ tareaId, alumnoId, token }) => {
  const [archivo, setArchivo] = useState(null);
  const [comentario, setComentario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const handleArchivoChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setMensaje("⚠️ Selecciona un archivo antes de enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("comentario", comentario);
    formData.append("tarea", tareaId);
    formData.append("alumno", alumnoId);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/entregas", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setMensaje("✅ Entrega enviada correctamente.");
    } catch (error) {
      console.error("❌ Error al enviar tarea:", error);
      setMensaje("❌ Error al enviar la entrega.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        className="w-full border rounded p-2"
        placeholder="Comentario (opcional)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      <input type="file" onChange={handleArchivoChange} className="block" />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Enviando..." : "Entregar tarea"}
      </button>

      {mensaje && (
        <p className={`text-sm ${mensaje.includes("✅") ? "text-green-600" : "text-red-600"}`}>
          {mensaje}
        </p>
      )}
    </form>
  );
};

export default EntregarTarea;
