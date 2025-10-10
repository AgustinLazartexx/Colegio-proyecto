import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import axios from "axios";

const EntregasTarea = () => {
  const { tareaId } = useParams();
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notaEditando, setNotaEditando] = useState({});
  const [comentarioEditando, setComentarioEditando] = useState({});

  const fetchEntregas = async () => {
    try {
      const { data } = await axios.get(`/api/entregas/${tareaId}`);
      setEntregas(data);
    } catch (err) {
      setError("Error al cargar entregas");
    } finally {
      setLoading(false);
    }
  };

  const handleNotaChange = (id, value) => {
    setNotaEditando({ ...notaEditando, [id]: value });
  };

  const handleComentarioChange = (id, value) => {
    setComentarioEditando({ ...comentarioEditando, [id]: value });
  };

  const calificarEntrega = async (id) => {
    try {
      const nota = notaEditando[id];
      const comentario = comentarioEditando[id];

      if (!nota) return alert("Debe ingresar una nota");

      await axios.put(`/api/entregas/${id}`, { nota, comentario });
      alert("Entrega calificada ✅");
      fetchEntregas(); // refrescar
    } catch (error) {
      alert("Error al calificar");
    }
  };

  useEffect(() => {
    fetchEntregas();
  }, [tareaId]);

  if (loading) return <p className="text-center mt-10">Cargando entregas...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Entregas de la Tarea</h1>
      {entregas.length === 0 ? (
        <p className="text-center">No hay entregas todavía.</p>
      ) : (
        <div className="space-y-6">
          {entregas.map((entrega) => (
            <div key={entrega._id} className="border rounded p-4 shadow-sm">
              <p className="font-semibold">Alumno: {entrega.alumno?.nombre || "Sin nombre"}</p>
              <p>
                Comentario del alumno:{" "}
                <span className="italic">{entrega.comentario || "Ninguno"}</span>
              </p>
              <a
                href={import.meta.env.VITE_BACKEND_URL + "/" + entrega.archivo}
                target="_blank"
                className="text-blue-600 underline block my-2"
              >
                Ver archivo entregado 📎
              </a>
              {entrega.nota ? (
                <p className="text-green-600 font-medium">Nota: {entrega.nota}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    placeholder="Nota (0-10)"
                    className="border rounded px-2 py-1"
                    onChange={(e) => handleNotaChange(entrega._id, e.target.value)}
                  />
                  <textarea
                    placeholder="Comentario (opcional)"
                    className="border rounded px-2 py-1"
                    onChange={(e) => handleComentarioChange(entrega._id, e.target.value)}
                  />
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => calificarEntrega(entrega._id)}
                  >
                    Calificar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntregasTarea;
