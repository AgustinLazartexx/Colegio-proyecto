import axios from 'axios';

const configuredBackendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BACKEND_URL = configuredBackendUrl.startsWith("http")
  ? configuredBackendUrl.replace(/\/+$/, "")
  : `https://${configuredBackendUrl.replace(/\/+$/, "")}`;

// 1. Configuración inicial
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`
});

// 2. Interceptor de Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const getUploadUrl = (path) => `${BACKEND_URL}/${path}`;
export const getBackendUrl = () => BACKEND_URL;
export const BACKEND_API_URL = `${BACKEND_URL}/api`;
export const solicitarRecuperacion = (email) => api.post('/auth/forgot-password', { email });
export const restablecerPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export { BACKEND_URL };
export default api;

// ==========================================
//       FUNCIONES DE USUARIOS
// ==========================================
export const getAdminStats = (cicloLectivoId) =>
  api.get('/admin/stats', { params: cicloLectivoId ? { cicloLectivoId } : {} });
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
export const setMateriaActive = (id, isActive) => api.put(`/materias/${id}/estado`, { isActive });
export const getMateriasProfesor = () => api.get('/materias/profesor/listado');

// ==========================================
//       CLASES (Gestión y Profesor)
// ==========================================
export const crearClase = (data) => api.post('/clases', data);
export const actualizarClase = (id, data) => api.put(`/clases/${id}`, data);
export const setClaseActive = (id, isActive) => api.put(`/clases/${id}/estado`, { isActive });

// Admin: Todas las clases
export const getTodasLasClases = (params = {}) => api.get('/clases', { params });

// Ciclos lectivos
export const getCiclos = () => api.get('/ciclos');
export const getCicloActivo = () => api.get('/ciclos/activo');
export const crearCiclo = (data) => api.post('/ciclos', data);
export const cambiarEstadoCiclo = (id, estado) => api.patch(`/ciclos/${id}/estado`, { estado });
export const getPreviewCierreCiclo = (id) => api.get(`/ciclos/${id}/preview-cierre`);
export const cerrarCiclo = (id, ajustes) => api.post(`/ciclos/${id}/cerrar`, { ajustes });
export const clonarClasesCiclo = (id) => api.post(`/ciclos/${id}/clonar-clases`);
export const importarAlumnosCiclo = (id) => api.post(`/ciclos/${id}/importar-alumnos`);
export const getRecuperacionesMateria = (cicloId, materiaId) =>
  api.get(`/ciclos/${cicloId}/recuperaciones/${materiaId}`);
export const cargarNotaRecuperacion = (cicloId, materiaId, alumnoId, notaRecuperacion) =>
  api.patch(`/ciclos/${cicloId}/recuperaciones/${materiaId}/${alumnoId}`, { notaRecuperacion });
export const getMisMateriasPrevias = () => api.get('/ciclos/previas/mias');
export const getPreviasAlumno = (alumnoId) => api.get(`/ciclos/previas/${alumnoId}`);
export const getBoletinAlumno = (alumnoId, cicloLectivoId) =>
  api.get(`/notas/alumno/${alumnoId}`, { params: cicloLectivoId ? { cicloLectivoId } : {} });
export const getAsistenciasAlumno = (alumnoId, cicloLectivoId) =>
  api.get(`/asistencias/alumno/${alumnoId}`, { params: cicloLectivoId ? { cicloLectivoId } : {} });

// Profesor: Solo mis clases
export const getMisClases = (params = {}) => api.get('/clases/misclases', { params });

// Detalle y Alumnos de CLASE
export const getClaseById = (id) => api.get(`/clases/${id}`);
export const getAlumnosDeClase = (claseId) => api.get(`/clases/${claseId}/alumnos`);
export const cambiarEstadoAlumnoDeClase = (claseId, alumnoId, isActive) =>
  api.put(`/clases/${claseId}/alumnos/${alumnoId}/estado`, { isActive });
export const getMisClasesAlumno = (cicloLectivoId) =>
  api.get('/clases/alumno/mis-clases', { params: cicloLectivoId ? { cicloLectivoId } : {} });

// ==========================================
//    FUNCIONES "VIEJAS" O DE MATERIAS 
//    (Necesarias para CargarNotas.jsx)
// ==========================================
export const getAlumnosDeMateria = (materiaId, cicloLectivoId) => {
  return api.get(`/materias/${materiaId}/alumnos`, {
    params: cicloLectivoId ? { cicloLectivoId } : {},
  });
};

export const getNotasDeMateria = (materiaId, trimestre, cicloLectivoId) => {
  return api.get(`/notas/materia/${materiaId}`, {
    params: { trimestre, ...(cicloLectivoId ? { cicloLectivoId } : {}) }
  });
};

// ==========================================
//       GESTIÓN ALUMNOS (Admin)
// ==========================================
export const getAlumnosPorCurso = (anio, division, cicloLectivoId) =>
  api.get('/alumnos', { params: { anio, division, cicloLectivoId } });
export const asignarAlumnoAClase = (claseId, alumnoId) => api.post(`/clases/${claseId}/alumnos`, { alumnoId });

// ==========================================
//       ASISTENCIA
// ==========================================
export const registrarAsistencias = (data) => api.post('/asistencias', data);
// Esta función puede usarse para consultar si ya se tomó asistencia hoy
export const obtenerAsistenciaFecha = (claseId, fecha) => api.get('/asistencias', { params: { claseId, fecha } });
export const obtenerAsistenciasPorClaseYFecha = (claseId, fecha) => api.get('/asistencias', { params: { claseId, fecha } });
export const getReporteAsistencias = (claseId, fecha, cicloLectivoId) =>
  api.get('/asistencias/reporte-detallado', { params: { claseId, fecha, cicloLectivoId } });
export const getReporteAsistenciasMensual = (claseId, mes, cicloLectivoId) =>
  api.get('/asistencias/reporte-mensual', { params: { claseId, mes, cicloLectivoId } });
export const getMisAsistenciasAlumno = (cicloLectivoId) =>
  api.get('/asistencias/alumno/mis-asistencias', { params: cicloLectivoId ? { cicloLectivoId } : {} });
export const getAsistenciaGeneral = (anio, division, fecha) => api.get('/asistencias/general', { params: { anio, division, fecha } });
export const registrarAsistenciaGeneral = (data) => api.post('/asistencias/general', data);
export const compararAsistencias = (anio, division, fecha, cicloLectivoId) =>
  api.get('/asistencias/comparacion', { params: { anio, division, fecha, cicloLectivoId } });

// ==========================================
//       NOTAS Y TAREAS
// ==========================================
export const getAuditoriaNotas = (cicloLectivoId) =>
  api.get('/notas/auditoria', { params: cicloLectivoId ? { cicloLectivoId } : {} });
export const guardarNota = (data) => api.post('/notas/guardar-una', data);

export const crearTarea = (data) => api.post('/tareas', data);
export const getTareasProfesor = () => api.get('/tareas/profesor');
export const getTareasClase = (claseId) => api.get(`/tareas/clase/${claseId}`);
export const eliminarTarea = (id) => api.delete(`/tareas/${id}`);
export const getEntregasTarea = (tareaId) => api.get(`/entregas/tarea/${tareaId}`);
export const calificarEntrega = (id, data) => api.put(`/entregas/${id}/calificar`, data);
// --- NUEVO: Para que el alumno vea su boletín ---
export const getMisNotasAlumno = (cicloLectivoId) =>
  api.get('/notas/mias', { params: cicloLectivoId ? { cicloLectivoId } : {} });

// ==========================================
//       ANUNCIOS
// ==========================================
export const getMisAnuncios = () => api.get('/anuncios/profesor/mis-anuncios');
export const crearAnuncio = (data) => api.post('/anuncios', data);
export const actualizarAnuncio = (id, data) => api.put(`/anuncios/${id}`, data);
export const setAnuncioActive = (id, isActive) => api.put(`/anuncios/${id}/estado`, { isActive });
// --- NUEVO: Función para el alumno ---
export const getAnunciosAlumno = () => api.get('/anuncios/alumno/mis-anuncios');

// ==========================================
//       GESTIÓN DE CUOTAS (FINANZAS)
// ==========================================
export const getCuotasDeAlumno = (alumnoId, params = {}) => api.get(`/cuotas/alumno/${alumnoId}`, { params });
export const getCuotasAdministracion = (params = {}) => api.get('/cuotas/admin/listado', { params });
export const generarCuota = (data) => api.post('/cuotas/generar', data);
export const registrarPagoCuota = (cuotaId, metodoPago) => api.put(`/cuotas/pagar/${cuotaId}`, { metodoPago });
export const marcarCuotaVencida = (cuotaId) => api.put(`/cuotas/vencer/${cuotaId}`);

// Para el alumno
export const getMisCuotasAlumno = () => api.get('/cuotas/mis-cuotas');