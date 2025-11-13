// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Interceptor para incluir token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;

// --- INICIO DE CORRECCIÓN: FUNCIONES FALTANTES ---

// --- FUNCIONES DE ASISTENCIA ---

/**
 * Registra (o actualiza) las asistencias de una clase.
 * @param {object} payload - { claseId, fecha, asistencias: [{ alumno, estado }] }
 */
export const registrarAsistencias = async (payload) => {
  // Esta es la ruta correcta: POST /api/asistencias
  const { data } = await api.post('/asistencias', payload);
  return data;
};

/**
 * Obtiene las asistencias ya registradas para una clase y fecha.
 * @param {string} claseId
 * @param {string} fecha - (ej. "YYYY-MM-DD")
 */
export const obtenerAsistenciasPorClaseYFecha = async (claseId, fecha) => {
  // Esta es la ruta correcta: GET /api/asistencias
  const { data } = await api.get('/asistencias', {
    params: { claseId, fecha },
  });
  return data;
};

// --- FUNCIONES DE CLASES (Necesarias para la página de Asistencia) ---

/**
 * Obtiene todas las clases (para el dropdown del admin)
 */
export const obtenerClases = async () => {
  const { data } = await api.get('/clases');
  return data;
};

// --- FUNCIONES DE USUARIOS (Necesarias para la página de Asistencia) ---

/**
 * Obtiene los alumnos filtrados por año, división y rol
 */
export const obtenerAlumnosPorCurso = async (anio, division) => {
  const { data } = await api.get('/usuarios', {
    params: { anio, division, rol: 'alumno' },
  });
  return data;
};

// --- OTRAS FUNCIONES (Ejemplos) ---

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getPerfil = async () => {
  const { data } = await api.get('/auth/perfil');
  return data;
};
// --- FIN DE CORRECCIÓN ---