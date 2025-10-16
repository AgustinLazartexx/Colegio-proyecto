import { useState, useEffect } from "react"; // NUEVO: Se importa useEffect
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom"; // NUEVO: Se importa useNavigate y useLocation
import { ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext"; // NUEVO: Se importa el hook de autenticación

import "react-toastify/dist/ReactToastify.css";

// --- Tus componentes y páginas siguen igual ---
// Componentes generales
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
// Páginas principales
import Home from "./pages/Home";
import Unauthorized from "./pages/Unauthorized";
// Dashboards
import AlumnoDashboard from "./pages/AlumnoDashboard";
import ProfesorDashboard from "./pages/ProfesorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
// Páginas del profesor
import InicioProfesor from "./pages/profesor/InicioProfesor";
import Clases from "./pages/profesor/Clases";
import Mensajes from "./pages/profesor/Mensajes";
import EntregasTarea from "./pages/profesor/EntregasTarea";
import CargarTarea from "./pages/profesor/CargarTarea";
import VerAlumnosMateria from "./pages/profesor/VerAlumnosMateria";
import VerEntregas from "./pages/profesor/VerEntregas";
import CrudAnunciosProfesor from "./pages/profesor/CrudAnunciosProfesor";
import CargarNotas from "./pages/profesor/CargarNotas";
import TomarAsistencia from "./pages/profesor/TomarAsistencia";
// Páginas del alumno
import InicioAlumno from "./pages/alumno/InicioAlumno";
import InscripcionMaterias from "./pages/alumno/InscripcionMaterias";
import Materias from "./pages/alumno/Materias";
import TareasAlumno from './pages/alumno/TareasAlumno';
import Asistencias from "./pages/alumno/Asistencias";
import Examenes from "./pages/alumno/Examenes";
// Páginas del admin
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import MateriasAdmin from "./pages/admin/MateriasAdmin";
import Comunicados from "./pages/admin/Comunicados";
import Verificacion from "./pages/admin/Verificacion";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import TomarAsistenciaAdmin from "./pages/admin/TomarAsistenciaAdmin";
import VerAsistenciasAdmin from "./pages/admin/VerAsistenciasAdmin";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  // =======================================================
  // NUEVA LÓGICA DE REDIRECCIÓN INTELIGENTE
  // =======================================================
  const { authCargando, usuario } = useAuth(); // NUEVO: Obtenemos el estado de autenticación
  const navigate = useNavigate(); // NUEVO: Hook para navegar
  const location = useLocation(); // NUEVO: Hook para saber en qué página estamos

  useEffect(() => {
    // Si la verificación de sesión aún no ha terminado, no hacemos nada.
    if (authCargando) return;

    // Si la carga terminó, hay un usuario logueado Y estamos en la página de inicio...
    if (usuario && location.pathname === '/') {
      // ...lo redirigimos a su panel correspondiente.
      switch (usuario.rol) {
        case 'alumno':
          navigate('/alumno');
          break;
        case 'profesor':
          navigate('/profesor');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          break; // No hacemos nada si el rol es desconocido
      }
    }
  }, [authCargando, usuario, navigate, location]);

  // NUEVO: Mientras se verifica la sesión, mostramos un loader para evitar parpadeos
  if (authCargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Cargando...</h2>
      </div>
    );
  }
  // =======================================================
  // FIN DE LA NUEVA LÓGICA
  // =======================================================

  return (
    <>
      {/* Notificaciones */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Modales de login y registro */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
      
      {/* --- TU ESTRUCTURA DE RUTAS ORIGINAL PERMANECE INTACTA --- */}
      <Routes>
        {/* Página de inicio con Navbar */}
        <Route
          path="/"
          element={
            <>
              <Navbar
                onLoginClick={() => setShowLogin(true)}
                onRegisterClick={() => setShowRegister(true)}
              />
              <Home />
            </>
          }
        />

        {/* Ruta de acceso denegado */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas del alumno */}
        <Route
          path="/alumno/*"
          element={
            <PrivateRoute allowedRoles={["alumno"]}>
              <AlumnoDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<InicioAlumno />} />
          <Route path="materias" element={<Materias />} />
          <Route path="inscripcion" element={<InscripcionMaterias />} />
          <Route path="tareas" element={<TareasAlumno />} />
          <Route path="asistencia" element={<Asistencias />} />
          <Route path="examenes" element={<Examenes />} />
        </Route>

        {/* Rutas del profesor */}
        <Route
          path="/profesor/*"
          element={
            <PrivateRoute allowedRoles={["profesor"]}>
              <ProfesorDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<InicioProfesor />} />
          <Route path="clases" element={<Clases />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="tarea/:tareaId/entregas" element={<EntregasTarea />} />
          <Route path="cargar-tarea" element={<CargarTarea />} />
          <Route path="profesor/ver-alumnos" element={<PrivateRoute allowedRoles={["profesor"]}><VerAlumnosMateria /></PrivateRoute>} />
          <Route path="verEntregas" element={<VerEntregas />} />
          <Route path="crud-anuncios" element={<CrudAnunciosProfesor />} />
          <Route path="cargar-notas" element={<CargarNotas />} />
          <Route path="tomar-asistencia" element={<TomarAsistencia />} />
        </Route>

        {/* Rutas del admin */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<h2>Inicio Admin</h2>} />
          <Route path="Inicio" element={<DashboardAdmin />} />
          <Route path="usuarios" element={<UsuariosAdmin />} />
          <Route path="materias" element={<MateriasAdmin />} />
          <Route path="comunicados" element={<Comunicados />} />
          <Route path="verificacion" element={<Verificacion />} />
          <Route path="AsistenciaGestion" element={<TomarAsistenciaAdmin />} />
          <Route path="VerAsistencias" element={<VerAsistenciasAdmin />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;