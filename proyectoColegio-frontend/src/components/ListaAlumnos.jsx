// src/components/ListaAlumnos.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const ListaAlumnos = ({ materiaId, onClose }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const res = await axios.get(`/api/inscripciones/materia/${materiaId}`);
        setAlumnos(res.data);
      } catch (error) {
        console.error("Error al obtener los alumnos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumnos();
  }, [materiaId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Alumnos inscriptos</h2>

        {loading ? (
          <p>Cargando...</p>
        ) : alumnos.length === 0 ? (
          <p>No hay alumnos inscriptos en esta materia.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {alumnos.map((alumno) => (
              <li
                key={alumno._id}
                className="border p-2 rounded bg-gray-50 flex justify-between items-center"
              >
                <span>{alumno.nombre} {alumno.apellido}</span>
                <span className="text-sm text-gray-500">{alumno.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ListaAlumnos;
