import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  Book,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  User,
  ListPlus,
} from "lucide-react";

const InscripcionMaterias = () => {
  const { usuario, token } = useAuth();
  
  const [materias, setMaterias] = useState([]);
  const [inscribiendo, setInscribiendo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerMaterias = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get("http://localhost:5000/api/materias", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterias(res.data);
      } catch (error) {
        console.error("Error al obtener materias", error);
        setError("No se pudieron cargar las materias disponibles. Por favor, reintenta.");
        toast.error("No se pudieron cargar las materias.");
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      obtenerMaterias();
    } else {
      setLoading(false);
      setError("No estás autenticado. Por favor, inicia sesión para ver las materias.");
    }
  }, [token]);

  const inscribirse = async (materiaId) => {
    setInscribiendo(materiaId);
    try {
      await axios.post(
        `http://localhost:5000/api/materias/inscribirse/${materiaId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle size={20} /> ¡Inscripción exitosa!
        </div>
      );
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Ya estás inscripto o hubo un error.";
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle size={20} /> {errorMessage}
        </div>
      );
    } finally {
      setInscribiendo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-lg text-gray-700">Cargando materias disponibles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <XCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Inscripción a Materias
          </h1>
          <p className="text-xl text-gray-600">
            Explora las materias disponibles y únete a ellas.
          </p>
        </div>
        
        {materias.length === 0 ? (
          <div className="flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
              <Book className="text-gray-400 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No hay materias disponibles</h2>
              <p className="text-gray-600">
                Por favor, regresa más tarde.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {materias.map((materia) => (
              <div
                key={materia._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transform hover:scale-105 transition-transform duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-600 text-white rounded-full p-3 shadow-md">
                        <Book size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {materia.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">{materia.sigla || "Materia"}</p>
                      </div>
                    </div>
                    {materia.anio && (
                      <div className="bg-purple-100 text-purple-700 rounded-full px-4 py-1 text-sm font-semibold flex items-center gap-1">
                        <Calendar size={14} />
                        {materia.anio}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-gray-700 mt-4">
                    <User className="text-gray-400 mr-3" />
                    <span className="text-sm font-medium">
                      Profesor:{" "}
                      <span className="font-semibold text-gray-900">
                        {materia.profesor?.nombre || "Sin asignar"} {materia.profesor?.apellido || ""}
                      </span>
                    </span>
                  </div>
                  
                  {/* Botón de Inscripción */}
                  <button
                    onClick={() => inscribirse(materia._id)}
                    disabled={inscribiendo === materia._id}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inscribiendo === materia._id ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Inscribiendo...</span>
                      </>
                    ) : (
                      <>
                        <ListPlus size={20} />
                        <span>Inscribirme</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InscripcionMaterias;