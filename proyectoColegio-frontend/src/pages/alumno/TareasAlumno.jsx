import React, { useEffect, useState, useCallback } from "react";
import { useAuth, apiClient } from "../../context/AuthContext";
import EntregarTarea from "../../components/alumno/EntregarTarea";
import { BookOpen, Calendar, Download, FileText, Loader2, AlertTriangle, Inbox } from "lucide-react";

// Componente para una Tarea individual
const TareaItem = ({ tarea }) => {
  const esVencida = new Date(tarea.fechaEntrega) < new Date();
  
  return (
    <li className="border-t border-gray-200 py-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{tarea.titulo}</h3>
          <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>
          <div className={`text-sm flex items-center gap-2 mt-2 font-medium ${esVencida ? 'text-red-600' : 'text-gray-500'}`}>
            <Calendar size={16} />
            <span>Fecha de entrega: {new Date(tarea.fechaEntrega).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
        {tarea.archivo && (
          <a
            href={`http://localhost:5000/uploads/${tarea.archivo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
          >
            <Download size={16} />
            Descargar Archivo
          </a>
        )}
      </div>
      <EntregarTarea tareaId={tarea._id} />
    </li>
  );
};

// Componente principal de la página
const TareasAlumno = () => {
  const { usuario, authCargando } = useAuth();
  const [tareasPorMateria, setTareasPorMateria] = useState([]); // MEJORA: Usamos un array para ordenar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 const fetchTareas = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const resMaterias = await apiClient.get(`/materias/alumno/${userId}`);
      
      const materiasAlumno = resMaterias.data.filter(materia => 
        // CAMBIO AQUÍ: Añadimos 'alumnoId &&' para evitar el error con valores nulos
      materia.alumnos?.some(alumnoId => alumnoId && alumnoId.toString() === userId.toString())
      );

      if (materiasAlumno.length === 0) {
        setTareasPorMateria([]);
        setLoading(false);
        return;
      }

      const promesasTareas = materiasAlumno.map(materia =>
        apiClient.get(`/tareas/alumno/materia/${materia._id}`)
          .then(res => ({ ...materia, tareas: res.data || [] }))
          .catch(err => {
            console.error(`Error al cargar tareas de ${materia.nombre}:`, err);
            return { ...materia, tareas: [] };
          })
      );
      
      const materiasConTareas = await Promise.all(promesasTareas);
      setTareasPorMateria(materiasConTareas);

    } catch (err) {
      console.error("Error al cargar las materias del alumno:", err);
      setError("No se pudieron cargar tus materias y tareas. Intentá de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
}, []);

  useEffect(() => {
    if (authCargando) {
      return;
    }
    const userId = usuario?.id;
    if (userId) {
      fetchTareas(userId);
    } else {
      setLoading(false);
      setError("No se pudo identificar al usuario.");
    }
  }, [authCargando, usuario, fetchTareas]);

  if (authCargando || loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-lg text-gray-600 font-medium">
          {authCargando ? "Verificando sesión..." : "Cargando tus tareas..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-lg text-center shadow-md">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Ocurrió un error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <FileText size={48} className="mx-auto text-blue-600 mb-2" />
          <h1 className="text-4xl font-bold text-gray-800">Mis Tareas</h1>
          <p className="text-lg text-gray-600 mt-2">Revisá y entregá tus trabajos pendientes.</p>
        </header>

        {tareasPorMateria.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-md">
            <Inbox size={52} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700">¡Todo en orden!</h2>
            <p className="text-gray-500 mt-2">No tenés tareas pendientes o aún no estás inscrito en ninguna materia.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {tareasPorMateria.map((materia) => (
              <section key={materia._id} className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
                <header className="flex items-center gap-4 mb-4 border-b pb-4">
                  <BookOpen className="text-blue-600" size={28} />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{materia.nombre}</h2>
                    <p className="text-sm font-medium text-gray-500">Año: {materia.anio}</p>
                  </div>
                </header>
                {materia.tareas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay tareas asignadas para esta materia.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {materia.tareas.map((tarea) => (
                      <TareaItem key={tarea._id} tarea={tarea} />
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TareasAlumno;