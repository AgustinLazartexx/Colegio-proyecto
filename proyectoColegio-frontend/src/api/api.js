import axios from 'axios';

// 1. Configuración inicial
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`
});

// 2. Interceptor de Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ==========================================
//       FUNCIONES DE USUARIOS (Backend user.routes.js)
// ==========================================

// GET /api/usuarios
export const getUsuarios = (filtros = {}) => {
  return api.get('/usuarios', { params: filtros });
};

// POST /api/usuarios/admin/crear  <-- ¡AQUÍ ESTABA EL DETALLE!
export const crearUsuario = (userData) => {
  return api.post('/usuarios/admin/crear', userData);
};

// PUT /api/usuarios/:id
export const actualizarUsuario = (id, userData) => {
  return api.put(`/usuarios/${id}`, userData);
};

// DELETE /api/usuarios/:id
export const eliminarUsuario = (id) => {
  return api.delete(`/usuarios/${id}`);
};

// GET /api/usuarios/profesores (Asegúrate de tener esta ruta en el back o usa un filtro en getUsuarios)
export const getProfesores = () => {
    // Si no tienes una ruta especifica, filtramos en el frontend o backend
    // Por ahora asumimos que existe o usamos getUsuarios
    return api.get('/usuarios', { params: { rol: 'profesor' } });
};
// --- MATERIAS ---
// Para Admin (trae todas o filtra por año/profe)
export const getMaterias = (params = {}) => api.get('/materias', { params });

// Para Profesor (trae SOLO las suyas) - NUEVA FUNCIÓN
export const getMateriasProfesor = () => api.get('/materias/profesor/listado');

export const getMateriaById = (id) => api.get(`/materias/${id}`);
export const createMateria = (data) => api.post('/materias', data);
export const updateMateria = (id, data) => api.put(`/materias/${id}`, data);
export const deleteMateria = (id) => api.delete(`/materias/${id}`);

// --- CLASES ---

export const crearClase = (data) => api.post('/clases', data);
export const actualizarClase = (id, data) => api.put(`/clases/${id}`, data);
export const eliminarClase = (id) => api.delete(`/clases/${id}`);

export const getTodasLasClases = () => api.get('/clases'); 

// Para el PROFESOR: Obtiene solo las clases asignadas a él
export const getMisClases = () => api.get('/clases/misclases');

// Obtener detalle de una clase por ID (útil para admin y profesor)
export const getClaseById = (id) => api.get(`/clases/${id}`);

// --- GESTIÓN ALUMNOS EN CLASES ---
export const getAlumnosDeClase = (claseId) => {
    return api.get(`/clases/${claseId}/alumnos`);
};

// CORRECCIÓN: Usamos getUsuarios filtrando por rol, año y división
export const getAlumnosPorCurso = (anio, division) => {
    const params = { rol: 'alumno' };
    if (anio) params.anio = anio;
    if (division) params.division = division;
    return api.get('/usuarios', { params }); 
};

export const asignarAlumnoAClase = (claseId, alumnoId) => {
    return api.post(`/clases/${claseId}/alumnos`, { alumnoId });
};

export const desasignarAlumnoDeClase = (claseId, alumnoId) => {
    return api.delete(`/clases/${claseId}/alumnos/${alumnoId}`);
}

// --- ASISTENCIA ---
export const registrarAsistencias = (data) => api.post('/asistencias', data);
export const obtenerAsistenciasPorClaseYFecha = (claseId, fecha) => api.get('/asistencias', { params: { claseId, fecha } });

// --- NOTAS ---
export const getNotasPorClase = (claseId) => api.get(`/notas/clase/${claseId}`);
export const crearNota = (data) => api.post('/notas', data);
export const updateNota = (id, data) => api.put(`/notas/${id}`, data);
export const deleteNota = (id) => api.delete(`/notas/${id}`);
export const getAuditoriaNotas = () => api.get('/notas/auditoria');

// --- TAREAS Y ENTREGAS ---
export const crearTarea = (data) => api.post('/tareas', data);
export const getTareasProfesor = () => api.get('/tareas/profesor');
export const getTareasClase = (claseId) => api.get(`/tareas/clase/${claseId}`);
export const eliminarTarea = (id) => api.delete(`/tareas/${id}`);
export const getEntregasTarea = (tareaId) => api.get(`/entregas/tarea/${tareaId}`);
export const calificarEntrega = (id, data) => api.put(`/entregas/${id}/calificar`, data);

// --- FUNCIONES ESPECÍFICAS DE NOTAS Y MATERIAS ---

// Obtener alumnos de una materia específica
export const getAlumnosDeMateria = (materiaId) => {
  return api.get(`/materias/${materiaId}/alumnos`);
};

// Obtener las notas de una materia filtradas por trimestre
export const getNotasDeMateria = (materiaId, trimestre) => {
  return api.get(`/notas/materia/${materiaId}`, {
    params: { trimestre }
  });
};

// Guardar una sola nota
export const guardarNota = (data) => {
  // data: { materiaId, alumnoId, trimestre, tipoNota, nota }
  return api.post('/notas/guardar-una', data);
};

