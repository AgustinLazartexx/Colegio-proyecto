import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext";
import "react-toastify/dist/ReactToastify.css";

// Componentes generales
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import LoginModal from "./components/LoginModal";

// Páginas principales
import Home from "./pages/Home";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Unauthorized from "./pages/Unauthorized";

// Dashboards
import AlumnoDashboard from "./pages/AlumnoDashboard";
import ProfesorDashboard from "./pages/ProfesorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Páginas del profesor
import InicioProfesor from "./pages/profesor/InicioProfesor";
import Clases from "./pages/profesor/Clases";
import EspacioMateria from "./pages/profesor/EspacioMateria";
import CrudAnunciosProfesor from "./pages/profesor/CrudAnunciosProfesor";
import TomarAsistencia from "./pages/profesor/TomarAsistencia";
import PaginaSubirNotas from "./pages/profesor/PaginaSubirNotas"; 

// Páginas del alumno
import InicioAlumno from "./pages/alumno/InicioAlumno";
import Materias from "./pages/alumno/Materias";
import TareasAlumno from './pages/alumno/TareasAlumno';
import AsistenciasAlumno from "./pages/alumno/AsistenciasAlumno";
import Boletin from "./pages/alumno/Boletin";
import AnunciosAlumno from "./pages/alumno/AnunciosAlumno"; // Importar componente

// Páginas del admin
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import MateriasAdmin from "./pages/admin/MateriasAdmin";
import ClasesAdmin from "./pages/admin/ClasesAdmin";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import AsistenciasAdmin from "./pages/admin/AsistenciasAdmin";
import AdminGestionNotas from "./pages/admin/AdminGestionNotas";
import CiclosLectivosAdmin from "./pages/admin/CiclosLectivosAdmin";
import CuotasResumenAdmin from "./pages/admin/CuotasResumenAdmin";
import AlumnosRiesgoAdmin from "./pages/admin/AlumnosRiesgoAdmin";


function App() {
  const [showLogin, setShowLogin] = useState(false);
  const { authCargando, usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authCargando) return;
    if (usuario && location.pathname === '/') {
      switch (usuario.rol) {
        case 'alumno': navigate('/alumno'); break;
        case 'profesor': navigate('/profesor'); break;
        case 'admin': navigate('/admin'); break;
        default: break;
      }
    }
  }, [authCargando, usuario, navigate, location]);

  if (authCargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Cargando...</h2>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      
      <Routes>
        <Route path="/" element={<><Navbar onLoginClick={() => setShowLogin(true)} /><Home /></>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas ALUMNO */}
        <Route path="/alumno/*" element={<PrivateRoute allowedRoles={["alumno"]}><AlumnoDashboard /></PrivateRoute>}>
          <Route index element={<InicioAlumno />} />
          <Route path="materias" element={<Materias defaultTab="materias" />} />
          <Route path="inscripcion" element={<Materias defaultTab="horario" />} />
          <Route path="tareas" element={<TareasAlumno />} />
          <Route path="asistencias" element={<AsistenciasAlumno />} />
          <Route path="boletin" element={<Boletin />} />
          <Route path="anuncios" element={<AnunciosAlumno />} />
        </Route>

        {/* Rutas PROFESOR */}
        <Route path="/profesor/*" element={<PrivateRoute allowedRoles={["profesor"]}><ProfesorDashboard /></PrivateRoute>}>
          <Route index element={<InicioProfesor />} />
          <Route path="Clases" element={<Clases />} />
          <Route path="Clases/:claseId" element={<EspacioMateria />} />
          {/* Rutas legacy redirigidas al flujo unificado por materia */}
          <Route path="mensajes" element={<Navigate to="/profesor/Clases" replace />} />
          <Route path="tarea/:tareaId/entregas" element={<Navigate to="/profesor/Clases" replace />} />
          <Route path="cargar-tarea" element={<Navigate to="/profesor/Clases" replace />} />
          <Route path="ver-alumnos" element={<Navigate to="/profesor/Clases" replace />} />
          <Route path="verEntregas" element={<Navigate to="/profesor/Clases" replace />} />
          {/* Vistas globales preservadas por compatibilidad hasta confirmación de limpieza */}
          <Route path="crud-anuncios" element={<CrudAnunciosProfesor />} />
          <Route path="cargar-notas" element={<PaginaSubirNotas />} />
          <Route path="tomar-asistencia" element={<TomarAsistencia />} />
        </Route>

        {/* Rutas ADMIN */}
        <Route path="/admin/*" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>}>
          <Route index element={<DashboardAdmin />} />
          <Route path="Inicio" element={<DashboardAdmin />} />
          <Route path="usuarios" element={<UsuariosAdmin />} />
          <Route path="cuotas" element={<CuotasResumenAdmin />} />
          <Route path="riesgo-academico" element={<AlumnosRiesgoAdmin />} />
          <Route path="materias" element={<MateriasAdmin />} />
          <Route path="ciclos" element={<CiclosLectivosAdmin />} />
          {/* Clases e Inscripciones unificadas con SlideOverDrawer */}
          <Route path="CrearClases" element={<ClasesAdmin />} />
          <Route path="clases" element={<ClasesAdmin />} />
          <Route path="clasesAdminAlumnos" element={<ClasesAdmin />} />
          <Route path="clases/:claseId/gestionar" element={<ClasesAdmin />} />
          {/* Asistencias unificadas (Registrar / Historial) */}
          <Route path="asistencias" element={<AsistenciasAdmin defaultTab="registrar" />} />
          <Route path="AsistenciaGestion" element={<AsistenciasAdmin defaultTab="registrar" />} />
          <Route path="VerAsistencias" element={<AsistenciasAdmin defaultTab="historial" />} />
          {/* Notas y Auditoría unificadas */}
          <Route path="GestionNotas" element={<AdminGestionNotas defaultTab="planilla" />} />
          <Route path="AuditoriaNotas" element={<AdminGestionNotas defaultTab="auditoria" />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;