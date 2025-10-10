// src/pages/profesor/AlumnosInscriptos.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const AlumnosInscriptos = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerAlumnos = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/materias/profesor/alumnos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDatos(res.data); // Espera que el back devuelva algo como [{ materia: ..., alumnos: [...] }, ...]
      } catch (error) {
        console.error("Error al obtener alumnos:", error.response || error.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerAlumnos();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando alumnos...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center">Alumnos Inscriptos</h2>
      {datos.length === 0 ? (
        <p className="text-center text-gray-600">No hay alumnos inscriptos aún.</p>
      ) : (
        datos.map((materia, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">{materia.nombreMateria}</h3>
            <ul className="space-y-1">
              {materia.alumnos.map((alumno) => (
                <li key={alumno._id} className="border px-4 py-2 rounded">
                  {alumno.nombre} {alumno.apellido} - {alumno.email}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default AlumnosInscriptos;
