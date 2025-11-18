import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Importar Link
import { 
  getAlumnosDeClase, 
  getAlumnosPorCurso, 
  asignarAlumnoAClase, 
  desasignarAlumnoDeClase,
  getClaseById 
} from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

// Componente de Carga
const Loader = () => (
  <div className="p-6 text-center">
    <h2 className="text-xl">Cargando...</h2>
    {/* Puedes añadir un spinner aquí si quieres */}
  </div>
);

const AdminGestionAlumnosClase = () => {
  const { claseId } = useParams();
  const { user } = useAuth(); // Obtenemos el usuario (puede ser null inicialmente)
  
  const [claseInfo, setClaseInfo] = useState(null);
  const [alumnosInscritos, setAlumnosInscritos] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  
  const [filtros, setFiltros] = useState({ anio: '', division: '' });
  const [loading, setLoading] = useState(true); // Empezar en true
  const [error, setError] = useState('');

  // --- Carga inicial de datos ---
  useEffect(() => {
    // CORRECCIÓN: No hacer nada si 'user' o 'claseId' aún no están listos
    if (!user || !claseId) {
      setLoading(true); // Mantener el estado de carga
      return;
    }

    const cargarDatos = async () => {
      // Comprobar el rol aquí, ahora que 'user' no es null
      if (user.rol !== 'admin') {
        setError('No tienes permisos para acceder a esta página.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(''); // Limpiar errores previos

        // 1. Obtener info de la clase
        const resClase = await getClaseById(claseId);
        if (!resClase.data) {
          throw new Error('No se recibieron datos de la clase.');
        }
        
        // Guardamos la info de la clase
        setClaseInfo(resClase.data);
        
        // 2. Obtener alumnos ya inscritos
        await fetchAlumnosInscritos();

        // 3. Cargar alumnos disponibles usando 'resClase.data'
        if (resClase.data.anio && resClase.data.division) {
          setFiltros({ anio: resClase.data.anio, division: resClase.data.division });
          await fetchAlumnosDisponibles(resClase.data.anio, resClase.data.division);
        }
        
      } catch (err) {
        console.error(err);
        setError('Error al cargar los datos de la clase.');
        Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
    
    // CORRECCIÓN: Depender de 'user' y 'claseId'
  }, [claseId, user]); 

  
  // --- Funciones de Fetch ---

  const fetchAlumnosInscritos = async () => {
    try {
      const resInscritos = await getAlumnosDeClase(claseId);
      setAlumnosInscritos(resInscritos.data);
    } catch (err) {
      console.error('Error fetching inscritos', err);
      Swal.fire('Error', 'No se pudo actualizar la lista de inscritos.', 'error');
    }
  };

  const fetchAlumnosDisponibles = async (anio, division) => {
    try {
      const resDisponibles = await getAlumnosPorCurso(anio, division);
      
      // Volvemos a pedir los IDs inscritos por si acaso
      const inscritosIds = await getAlumnosDeClase(claseId).then(res => new Set(res.data.map(a => a._id)));
      
      const disponibles = resDisponibles.data.filter(a => !inscritosIds.has(a._id));
      setAlumnosDisponibles(disponibles);
    } catch (err) {
      console.error('Error fetching disponibles', err);
      setAlumnosDisponibles([]);
      if (err.response && err.response.status === 404) {
         // No es un error, solo no se encontraron
      } else {
         Swal.fire('Error', 'Error al buscar alumnos.', 'error');
      }
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    if (filtros.anio && filtros.division) {
      setLoading(true);
      fetchAlumnosDisponibles(filtros.anio, filtros.division).finally(() => setLoading(false));
    } else {
      Swal.fire('Atención', 'Debe seleccionar un año y división.', 'warning');
    }
  };

  // --- Handlers de Acciones ---

  const handleAsignar = async (alumnoId) => {
    try {
      await asignarAlumnoAClase(claseId, alumnoId);
      Swal.fire('Éxito', 'Alumno asignado correctamente.', 'success');
      
      // Actualizar listas
      await fetchAlumnosInscritos();
      setAlumnosDisponibles(prev => prev.filter(a => a._id !== alumnoId));

    } catch (err) {
      console.error('Error al asignar', err);
      const msg = err.response?.data?.msg || 'Error al asignar el alumno.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleDesasignar = async (alumno) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a quitar a ${alumno.nombre} de esta clase.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await desasignarAlumnoDeClase(claseId, alumno._id);
          Swal.fire('Eliminado', `${alumno.nombre} ha sido quitado de la clase.`, 'success');
          
          // Actualizar listas
          await fetchAlumnosInscritos();
          // Si el alumno quitado coincide con el filtro actual, lo volvemos a mostrar
          if (String(alumno.anio) === String(filtros.anio) && alumno.division === filtros.division) {
             setAlumnosDisponibles(prev => [...prev, alumno].sort((a, b) => a.nombre.localeCompare(b.nombre)));
          }

        } catch (err) {
          console.error('Error al desasignar', err);
          const msg = err.response?.data?.msg || 'Error al quitar el alumno.';
          Swal.fire('Error', msg, 'error');
        }
      }
    });
  };


  // --- Renderizado ---

  // CORRECCIÓN: Manejar el estado de carga mientras 'user' es null
  if (loading || !user) return <Loader />;

  // Manejar el error de permisos o carga
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <h2 className="text-xl">Error</h2>
        <p>{error}</p>
        <Link to="/admin/clases" className="text-blue-500 hover:underline mt-4 inline-block">Volver a Clases</Link>
      </div>
    );
  }
  
  // CORRECCIÓN: Comprobar el rol de nuevo (seguridad doble)
  if (user.rol !== 'admin') {
     return (
       <div className="p-6 text-center text-red-500">
        <h2 className="text-xl">Acceso Denegado</h2>
        <Link to="/admin/clases" className="text-blue-500 hover:underline mt-4 inline-block">Volver a Clases</Link>
      </div>
     );
  }

  // Renderizado principal
  return (
    <div className="p-6">
      <Link to="/admin/clases" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Volver a la lista de clases</Link>
      
      <h1 className="text-3xl font-bold mb-4">
        Gestionar Alumnos
      </h1>
      
      {/* Añadir '?' para evitar error si 'claseInfo' es null brevemente */}
      {claseInfo && (
        <h2 className="text-xl text-gray-600 mb-6">
          Clase: {claseInfo.materia?.nombre} ({claseInfo.anio}° "{claseInfo.division}") - {claseInfo.diaSemana} {claseInfo.horaInicio}
        </h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Columna para AÑADIR alumnos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold mb-4">Buscar Alumnos para Añadir</h3>
          <form onSubmit={handleBuscar} className="flex space-x-2 mb-4">
            <select
              name="anio"
              value={filtros.anio}
              onChange={handleFiltroChange}
              className="form-select w-1/3 p-2 border rounded"
            >
              <option value="">Año</option>
              {[1, 2, 3, 4, 5, 6].map(a => <option key={a} value={a}>{a}°</option>)}
            </select>
            <input
              type="text"
              name="division"
              placeholder="División (ej. A)"
              value={filtros.division}
              onChange={handleFiltroChange}
              className="form-input w-1/3 p-2 border rounded"
              maxLength="2"
            />
            <button type="submit" className="btn-primary bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              Buscar
            </button>
          </form>
          
          <div className="max-h-96 overflow-y-auto">
            {alumnosDisponibles.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {alumnosDisponibles.map(alumno => (
                  <li key={alumno._id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{alumno.nombre}</p>
                      <p className="text-sm text-gray-500">{alumno.email}</p>
                    </div>
                    <button
                      onClick={() => handleAsignar(alumno._id)}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Añadir
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No hay alumnos disponibles con esos filtros.</p>
            )}
          </div>
        </div>

        {/* Columna para VER/QUITAR alumnos inscritos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold mb-4">Alumnos Inscritos ({alumnosInscritos.length})</h3>
          <div className="max-h-96 overflow-y-auto">
            {alumnosInscritos.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {alumnosInscritos.map(alumno => (
                  <li key={alumno._id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{alumno.nombre}</p>
                      <p className="text-sm text-gray-500">{alumno.email}</p>
                    </div>
                    <button
                      onClick={() => handleDesasignar(alumno)}
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No hay alumnos inscritos en esta clase.</p>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AdminGestionAlumnosClase;