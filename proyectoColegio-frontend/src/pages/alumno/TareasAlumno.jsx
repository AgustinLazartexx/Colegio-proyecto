import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import EntregarTarea from "../../components/alumno/EntregarTarea";

const TareasAlumno = () => {
  const { usuario, token, authCargando } = useAuth();
  const [tareasPorMateria, setTareasPorMateria] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("=== DEBUGGING AUTH ===");
    console.log("authCargando:", authCargando);
    console.log("usuario completo:", usuario);
    console.log("usuario.id:", usuario?.id);
    console.log("usuario._id:", usuario?._id);
    console.log("token desde contexto:", token);
    console.log("token existe:", !!token);
    console.log("====================");

    // No hacer nada si el contexto aún está cargando
    if (authCargando) {
      console.log("⏳ Contexto de auth aún cargando...");
      setLoading(true); // Asegurar que loading esté en true
      return;
    }

    // Si no hay usuario o token, no hacer nada
    const userId = usuario?.id || usuario?._id;
    if (!userId || !token) {
      console.log("⚠️ No hay usuario o token disponible");
      console.log("Estado actual - usuario:", !!usuario, "token:", !!token, "userId:", userId);
      setLoading(false);
      return;
    }

    const fetchTareas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔍 Buscando materias del alumno:", userId);
        
        const resMaterias = await axios.get(`http://localhost:5000/api/materias/alumno/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📘 Respuesta materias:", resMaterias.data);
        console.log("📘 Status de respuesta:", resMaterias.status);

        // Verificar si la respuesta tiene datos
        if (!resMaterias.data || resMaterias.data.length === 0) {
          console.log("No se encontraron materias para el alumno");
          setTareasPorMateria({});
          setLoading(false);
          return;
        }

        // Filtrar materias donde el alumno está inscrito
        const materiasAlumno = resMaterias.data.filter(materia => {
          console.log(`🔍 Procesando materia: ${materia.nombre}`);
          console.log(`🔍 Materia ID: ${materia._id || materia.id}`);
          console.log(`🔍 Alumnos en materia:`, materia.alumnos);
          
          // Verificar si materia.alumnos existe y es un array
          if (!materia.alumnos || !Array.isArray(materia.alumnos)) {
            console.log(`❌ Materia ${materia.nombre} sin alumnos o formato incorrecto:`, materia);
            return false;
          }
          
          // Verificar si el alumno está en la lista (comparar como strings por si acaso)
          const estaInscrito = materia.alumnos.some(alumnoId => {
            // Filtrar valores null/undefined antes de comparar
            if (!alumnoId) return false;
            
            const matches = alumnoId.toString() === userId.toString();
            console.log(`🔍 Comparando: "${alumnoId}" === "${userId}" = ${matches}`);
            return matches;
          });
          
          console.log(`📘 Materia ${materia.nombre}: alumno inscrito = ${estaInscrito}`);
          return estaInscrito;
        });

        console.log("📘 Materias filtradas del alumno:", materiasAlumno);

        if (materiasAlumno.length === 0) {
          console.log("El alumno no está inscrito en ninguna materia");
          setTareasPorMateria({});
          setLoading(false);
          return;
        }

        const tareasPorMateriaTemp = {};

        // Obtener tareas para cada materia
        for (const materia of materiasAlumno) {
          try {
            console.log(`🔍 Buscando tareas para materia: ${materia.nombre}`);
            console.log(`🔍 ID de materia: ${materia._id || materia.id}`);
            
            const materiaId = materia._id || materia.id;
            const resTareas = await axios.get(
              `http://localhost:5000/api/tareas/alumno/materia/${materiaId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            console.log(`📚 Tareas encontradas para ${materia.nombre}:`, resTareas.data);
            console.log(`📚 Status tareas ${materia.nombre}:`, resTareas.status);

            tareasPorMateriaTemp[materia.nombre] = {
              materia,
              tareas: resTareas.data || [],
            };
          } catch (tareaError) {
            console.error(`❌ Error al cargar tareas de ${materia.nombre}:`, tareaError);
            console.error(`❌ Response error:`, tareaError.response?.data);
            console.error(`❌ Status code:`, tareaError.response?.status);
            console.error(`❌ URL que falló:`, `http://localhost:5000/api/tareas/alumno/materia/${materiaId}`);
            // Continuar con otras materias aunque una falle
            tareasPorMateriaTemp[materia.nombre] = {
              materia,
              tareas: [],
            };
          }
        }

        console.log("📚 Tareas agrupadas final:", tareasPorMateriaTemp);
        setTareasPorMateria(tareasPorMateriaTemp);
        
      } catch (err) {
        console.error("❌ Error al cargar tareas:", err.response?.data || err.message);
        setError("Error al cargar las tareas. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    console.log("✅ Usuario y token disponibles, cargando tareas...");
    fetchTareas();

  }, [usuario?.id, usuario?._id, token, authCargando]); // Removí 'loading' de las dependencias

  // Mostrar loading mientras el contexto de auth está cargando
  if (authCargando) return <p className="text-center mt-10">Cargando autenticación...</p>;

  if (loading) return <p className="text-center mt-10">Cargando tareas...</p>;

  if (error) return (
    <div className="text-center mt-10">
      <p className="text-red-600">{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );

  if (!usuario) return (
    <p className="text-center mt-10 text-red-600">
      No hay usuario autenticado
    </p>
  );

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
        Tareas por materia
      </h1>

      {Object.keys(tareasPorMateria).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg">No estás inscrito en ninguna materia aún.</p>
        </div>
      ) : (
        Object.entries(tareasPorMateria).map(([nombreMateria, { materia, tareas }]) => (
          <div key={materia._id || materia.id} className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              📘 {nombreMateria} - Año {materia.anio}
            </h2>
            {tareas.length === 0 ? (
              <p className="text-gray-600">No hay tareas asignadas aún.</p>
            ) : (
              <ul className="space-y-4">
                {tareas.map((tarea) => (
                  <li key={tarea._id} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">{tarea.titulo}</h3>
                        <p className="text-sm text-gray-600">{tarea.descripcion}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Fecha entrega: {new Date(tarea.fechaEntrega).toLocaleDateString()}
                        </p>
                      </div>
                      {tarea.archivo && (
                        <a
                          href={`http://localhost:5000/uploads/${tarea.archivo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline text-sm"
                        >
                          📎 Descargar archivo
                        </a>
                      )}
                    </div>
                    {/* Formulario de entrega */}
                    <EntregarTarea 
                      tareaId={tarea._id}
                      alumnoId={usuario._id || usuario.id}
                      token={token}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default TareasAlumno;