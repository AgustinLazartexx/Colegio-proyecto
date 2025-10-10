import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FileText,
  Upload,
  BookOpen,
  Calendar,
  Layers,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

const CargarTarea = () => {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    materia: "",
    fechaEntrega: "",
  });
  const [archivo, setArchivo] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(true);

  useEffect(() => {
    const obtenerMaterias = async () => {
      const token = localStorage.getItem("token");
      setLoadingMaterias(true);
      try {
        const res = await axios.get("http://localhost:5000/api/materias/profesor/materias", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMaterias(res.data);
      } catch (error) {
        console.error("Error al obtener materias", error);
        toast.error("Error al cargar materias disponibles.");
      } finally {
        setLoadingMaterias(false);
      }
    };
    obtenerMaterias();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleArchivo = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("descripcion", form.descripcion);
    formData.append("fechaEntrega", form.fechaEntrega);
    formData.append("materia", form.materia);

    if (archivo) {
      formData.append("archivo", archivo);
    }

    try {
      await axios.post("http://localhost:5000/api/tareas", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle size={20} /> Tarea cargada con éxito.
        </div>
      );
      // Resetear el formulario
      setForm({
        titulo: "",
        descripcion: "",
        materia: "",
        fechaEntrega: "",
      });
      setArchivo(null);
    } catch (error) {
      console.error("Error al cargar tarea:", error.response || error.message);
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle size={20} /> No se pudo cargar la tarea.
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-200">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <BookOpen className="text-white" size={32} />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
            Crear Nueva Tarea
          </h2>
          <p className="text-gray-600 text-lg">
            Completa el formulario para asignar una nueva tarea a tus estudiantes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="relative">
            <FileText
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              name="titulo"
              placeholder="Título de la tarea"
              value={form.titulo}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          {/* Descripción */}
          <div className="relative">
            <Layers
              size={20}
              className="absolute left-3 top-4 text-gray-400"
            />
            <textarea
              name="descripcion"
              placeholder="Descripción detallada de la tarea"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              rows={4}
              required
            />
          </div>

          {/* Selector de Materia */}
          <div className="relative">
            <BookOpen
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            {loadingMaterias ? (
              <div className="flex items-center justify-center w-full h-12 bg-gray-100 rounded-xl">
                <Loader2 className="animate-spin text-gray-400" />
              </div>
            ) : (
              <select
                name="materia"
                value={form.materia}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all"
                required
              >
                <option value="" disabled>
                  Selecciona una materia
                </option>
                {materias.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha de Entrega */}
          <div className="relative">
            <Calendar
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              name="fechaEntrega"
              value={form.fechaEntrega}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          {/* Carga de Archivo */}
          <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={handleArchivo}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center text-gray-600">
              <Upload size={32} className="mb-2 text-indigo-500" />
              {archivo ? (
                <p className="font-medium text-indigo-700">
                  Archivo seleccionado:{" "}
                  <span className="font-bold">{archivo.name}</span>
                </p>
              ) : (
                <p className="font-medium">
                  Arrastra y suelta tu archivo aquí o haz clic para subir
                </p>
              )}
              <p className="text-sm mt-1">
                Formatos permitidos: .pdf, .doc, .docx, .jpg, .png
              </p>
            </div>
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : (
                <Send size={20} />
              )}
              {loading ? "Cargando Tarea..." : "Subir Tarea"}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CargarTarea;