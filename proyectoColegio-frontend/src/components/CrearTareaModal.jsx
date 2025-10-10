// src/components/CrearTareaModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const CrearTareaModal = ({ materiaId, onClose }) => {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fechaEntrega: "",
  });
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.fechaEntrega || !archivo) {
      return toast.error("Completa todos los campos y subí un archivo.");
    }

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("descripcion", form.descripcion);
    formData.append("fechaEntrega", form.fechaEntrega);
    formData.append("archivo", archivo);
    formData.append("materia", materiaId);

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/tareas", formData, {
        headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,},
      });
      toast.success("Tarea creada correctamente");
      onClose(); // Cierra el modal
    } catch (error) {
      console.error("Error al crear tarea:", error);
      toast.error("Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X size={24} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Crear Nueva Tarea</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Entrega</label>
            <input
              type="date"
              name="fechaEntrega"
              value={form.fechaEntrega}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Archivo</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFile}
              className="w-full"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white font-semibold ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Cargando..." : "Crear Tarea"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CrearTareaModal;
