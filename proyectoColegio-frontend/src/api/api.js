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
//       FUNCIONES DE USUARIOS
// ==========================================
export const getAdminStats = () => api.get('/admin/stats');
export const getUsuarios = (filtros = {}) => api.get('/usuarios', { params: filtros });
export const crearUsuario = (userData) => api.post('/usuarios/admin/crear', userData);
export const actualizarUsuario = (id, userData) => api.put(`/usuarios/${id}`, userData);
export const eliminarUsuario = (id) => api.delete(`/usuarios/${id}`);
export const getProfesores = () => api.get('/usuarios', { params: { rol: 'profesor' } });

// ==========================================
//       MATERIAS
// ==========================================
export const getMaterias = (params = {}) => api.get('/materias', { params });
export const getMateriaById = (id) => api.get(`/materias/${id}`);
export const createMateria = (data) => api.post('/materias', data);
export const updateMateria = (id, data) => api.put(`/materias/${id}`, data);
export const deleteMateria = (id) => api.delete(`/materias/${id}`);
export const getMateriasProfesor = () => api.get('/materias/profesor/listado');

// ==========================================
//       CLASES (Gestión y Profesor)
// ==========================================
export const crearClase = (data) => api.post('/clases', data);
export const actualizarClase = (id, data) => api.put(`/clases/${id}`, data);
export const eliminarClase = (id) => api.delete(`/clases/${id}`);

// Admin: Todas las clases
export const getTodasLasClases = () => api.get('/clases'); 

// Profesor: Solo mis clases
export const getMisClases = () => api.get('/clases/misclases');

// Detalle y Alumnos de CLASE
export const getClaseById = (id) => api.get(`/clases/${id}`);
export const getAlumnosDeClase = (claseId) => api.get(`/clases/${claseId}/alumnos`);

// ==========================================
//    FUNCIONES "VIEJAS" O DE MATERIAS 
//    (Necesarias para CargarNotas.jsx)
// ==========================================
export const getAlumnosDeMateria = (materiaId) => {
  return api.get(`/materias/${materiaId}/alumnos`);
};

export const getNotasDeMateria = (materiaId, trimestre) => {
  return api.get(`/notas/materia/${materiaId}`, {
    params: { trimestre }
  });
};

// ==========================================
//       GESTIÓN ALUMNOS (Admin)
// ==========================================
export const getAlumnosPorCurso = (anio, division) => {
    const params = { rol: 'alumno' };
    if (anio) params.anio = anio;
    if (division) params.division = division;
    return api.get('/usuarios', { params }); 
};
export const asignarAlumnoAClase = (claseId, alumnoId) => api.post(`/clases/${claseId}/alumnos`, { alumnoId });
export const desasignarAlumnoDeClase = (claseId, alumnoId) => api.delete(`/clases/${claseId}/alumnos/${alumnoId}`);

// ==========================================
//       ASISTENCIA
// ==========================================
export const registrarAsistencias = (data) => api.post('/asistencias', data);
// Esta función puede usarse para consultar si ya se tomó asistencia hoy
export const obtenerAsistenciaFecha = (claseId, fecha) => api.get('/asistencias', { params: { claseId, fecha } });
export const obtenerAsistenciasPorClaseYFecha = (claseId, fecha) => api.get('/asistencias', { params: { claseId, fecha } });
export const getReporteAsistencias = (claseId, fecha) => api.get('/asistencias/reporte-detallado', { params: { claseId, fecha } });

// ==========================================
//       NOTAS Y TAREAS
// ==========================================
export const getNotasPorClase = (claseId) => api.get(`/notas/clase/${claseId}`);
export const crearNota = (data) => api.post('/notas', data);
export const updateNota = (id, data) => api.put(`/notas/${id}`, data);
export const deleteNota = (id) => api.delete(`/notas/${id}`);
export const getAuditoriaNotas = () => api.get('/notas/auditoria');
export const guardarNota = (data) => api.post('/notas/guardar-una', data);

export const crearTarea = (data) => api.post('/tareas', data);
export const getTareasProfesor = () => api.get('/tareas/profesor');
export const getTareasClase = (claseId) => api.get(`/tareas/clase/${claseId}`);
export const eliminarTarea = (id) => api.delete(`/tareas/${id}`);
export const getEntregasTarea = (tareaId) => api.get(`/entregas/tarea/${tareaId}`);
export const calificarEntrega = (id, data) => api.put(`/entregas/${id}/calificar`, data);

// ==========================================
//       ANUNCIOS
// ==========================================
export const getMisAnuncios = () => api.get('/anuncios/profesor/mis-anuncios');
export const crearAnuncio = (data) => api.post('/anuncios', data);
export const actualizarAnuncio = (id, data) => api.put(`/anuncios/${id}`, data);
export const eliminarAnuncio = (id) => api.delete(`/anuncios/${id}`);