import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaBook,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaExclamationCircle,
} from "react-icons/fa";
import { RiLoader4Fill } from "react-icons/ri";

const AlumnoMaterias = () => {
  const { usuario } = useAuth();
  const token = localStorage.getItem("token");
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        setLoading(true);
        setError(null);
        // Utilizar el ID del usuario para obtener las materias a las que está inscrito
        const userId = usuario?.id || usuario?._id;
        if (!userId) {
          setError("No se pudo obtener el ID del usuario.");
          setLoading(false);
          return;
        }

        const res = await axios.get(`http://localhost:5000/api/materias/alumno/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMaterias(res.data);
      } catch (err) {
        console.error("Error al obtener materias:", err.response?.data || err.message);
        setError("No se pudieron cargar las materias. Inténtalo de nuevo más tarde.");
        toast.error("Error al cargar materias");
      } finally {
        setLoading(false);
      }
    };

    if (usuario && token) {
      fetchMaterias();
    }
  }, [usuario, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg">
          <RiLoader4Fill className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-lg text-gray-700">Cargando tus materias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <FaExclamationCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (materias.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <FaBook className="text-blue-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No tienes materias inscritas</h2>
          <p className="text-gray-600">
            Aún no te has inscrito en ninguna materia. Contáctate con tu administrador para que te asigne a una.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado de la página */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Mis Materias
          </h1>
          <p className="text-xl text-gray-600">
            Revisa las materias a las que te has inscrito.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {materias.map((materia) => (
            <div
              key={materia._id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white rounded-full p-3 shadow-md">
                      <FaBook size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {materia.nombre}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {materia.sigla || "Materia"}
                      </p>
                    </div>
                  </div>
                  {materia.anio && (
                    <div className="bg-blue-100 text-blue-700 rounded-full px-4 py-1 text-sm font-semibold flex items-center gap-1">
                      <FaCalendarAlt size={14} />
                      {materia.anio}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center text-gray-700">
                    <FaChalkboardTeacher className="text-gray-400 mr-3" />
                    <span className="text-sm font-medium">
                      Profesor:{" "}
                      <span className="font-semibold text-gray-900">
                        {materia.profesor?.nombre || "Sin asignar"} {materia.profesor?.apellido || ""}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Pie de página de la tarjeta */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  ID de Materia: {materia._id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlumnoMaterias;