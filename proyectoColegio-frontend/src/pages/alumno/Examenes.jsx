// src/pages/alumno/AnunciosAlumno.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Megaphone, ChevronDown, ChevronUp, User } from "lucide-react";

const AnunciosAlumno = () => {
  const { usuario, token } = useAuth();
  const [anunciosAgrupados, setAnunciosAgrupados] = useState({});
  const [materiasAbiertas, setMateriasAbiertas] = useState({});

  useEffect(() => {
    if (!usuario?._id && !usuario?.id) return;
    const idAlumno = usuario._id || usuario.id;

    axios
      .get(`http://localhost:5000/api/anuncios/alumno/${idAlumno}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const agrupados = res.data.reduce((acc, anuncio) => {
          const materia = anuncio.materia?.nombre || "Sin materia";
          if (!acc[materia]) acc[materia] = [];
          acc[materia].push(anuncio);
          return acc;
        }, {});
        setAnunciosAgrupados(agrupados);
      })
      .catch((err) => console.error("Error al cargar anuncios", err));
  }, [usuario, token]);

  const toggleMateria = (materia) => {
    setMateriasAbiertas((prev) => ({
      ...prev,
      [materia]: !prev[materia],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
        <Megaphone /> Comunicados del Profesor
      </h1>

      {Object.keys(anunciosAgrupados).length === 0 ? (
        <p className="text-gray-500">No tienes anuncios nuevos.</p>
      ) : (
        Object.keys(anunciosAgrupados).map((materia) => (
          <div
            key={materia}
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
          >
            {/* Cabecera de materia */}
            <button
              onClick={() => toggleMateria(materia)}
              className="w-full flex justify-between items-center px-4 py-3 bg-accent text-white font-semibold hover:bg-secondary transition"
            >
              <span>{materia}</span>
              {materiasAbiertas[materia] ? <ChevronUp /> : <ChevronDown />}
            </button>

            {/* Lista de anuncios */}
            {materiasAbiertas[materia] && (
              <div className="p-4 space-y-4">
                {anunciosAgrupados[materia].length === 0 ? (
                  <p className="text-gray-500 italic">Sin anuncios</p>
                ) : (
                  anunciosAgrupados[materia].map((a) => (
                    <div
                      key={a._id}
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
                    >
                      <h3 className="font-bold text-lg text-accent">{a.titulo}</h3>
                      <p className="text-gray-700 mt-1">{a.mensaje}</p>
                      <small className="text-gray-500 mt-2 flex items-center gap-1">
                        <User size={14} /> {a.profesor?.nombre || "Mensaje del Profesor"} —{" "}
                        {new Date(a.fecha).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AnunciosAlumno;
