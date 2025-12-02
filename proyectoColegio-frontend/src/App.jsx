import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext";
import "react-toastify/dist/ReactToastify.css";

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
import TomarAsistencia from "./pages/profesor/TomarAsistencia";
import PaginaSubirNotas from "./pages/profesor/PaginaSubirNotas"; 

// Páginas del alumno
import InicioAlumno from "./pages/alumno/InicioAlumno";
import InscripcionMaterias from "./pages/alumno/InscripcionMaterias";
import Materias from "./pages/alumno/Materias";
import TareasAlumno from './pages/alumno/TareasAlumno';
import AsistenciasAlumno from "./pages/alumno/AsistenciasAlumno";
import Boletin from "./pages/alumno/Boletin";
import AnunciosAlumno from "./pages/alumno/AnunciosAlumno"; // Importar componente

// Páginas del admin
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import MateriasAdmin from "./pages/admin/MateriasAdmin";
import CrearClases from "./pages/admin/CrearClases";
import ClasesAdmin from "./pages/admin/ClasesAdmin";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import TomarAsistenciaAdmin from "./pages/admin/TomarAsistenciaAdmin";
import VerAsistenciasAdmin from "./pages/admin/VerAsistenciasAdmin";
import AdminAuditoriaNotas from "./pages/admin/AdminPanelNotas";
import AdminGestionNotas from "./pages/admin/AdminGestionNotas";
import AdminGestionAlumnosClase from "./pages/admin/AdminGestionAlumnosClase";


function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
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
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
      
      <Routes>
        <Route path="/" element={<><Navbar onLoginClick={() => setShowLogin(true)} onRegisterClick={() => setShowRegister(true)} /><Home /></>} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas ALUMNO */}
        <Route path="/alumno/*" element={<PrivateRoute allowedRoles={["alumno"]}><AlumnoDashboard /></PrivateRoute>}>
          <Route index element={<InicioAlumno />} />
          <Route path="materias" element={<Materias />} />
          <Route path="inscripcion" element={<InscripcionMaterias />} />
          <Route path="tareas" element={<TareasAlumno />} />
          <Route path="asistencias" element={<AsistenciasAlumno />} />
          <Route path="boletin" element={<Boletin />} />
          <Route path="anuncios" element={<AnunciosAlumno />} />
          
        </Route>

        {/* Rutas PROFESOR */}
        <Route path="/profesor/*" element={<PrivateRoute allowedRoles={["profesor"]}><ProfesorDashboard /></PrivateRoute>}>
          <Route index element={<InicioProfesor />} />
          <Route path="Clases" element={<Clases />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="tarea/:tareaId/entregas" element={<EntregasTarea />} />
          <Route path="cargar-tarea" element={<CargarTarea />} />
          <Route path="profesor/ver-alumnos" element={<VerAlumnosMateria />} />
          <Route path="verEntregas" element={<VerEntregas />} />
          <Route path="crud-anuncios" element={<CrudAnunciosProfesor />} />
          <Route path="cargar-notas" element={<PaginaSubirNotas />} />
          <Route path="tomar-asistencia" element={<TomarAsistencia />} />
        </Route>

        {/* Rutas ADMIN */}
        <Route path="/admin/*" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>}>
          <Route index element={<h2>Inicio Admin</h2>} />
          <Route path="Inicio" element={<DashboardAdmin />} />
          <Route path="usuarios" element={<UsuariosAdmin />} />
          <Route path="materias" element={<MateriasAdmin />} />
          <Route path="CrearClases" element={<ClasesAdmin />} />
          
          <Route path="AsistenciaGestion" element={<TomarAsistenciaAdmin />} />
          <Route path="VerAsistencias" element={<VerAsistenciasAdmin />} />
          <Route path="AuditoriaNotas" element={<AdminAuditoriaNotas />} />
          <Route path="GestionNotas" element={<AdminGestionNotas />} />

          {/* === CORRECCIÓN DE LA RUTA === */}
          <Route path="clasesAdminAlumnos" element={<AdminGestionAlumnosClase />} /> {/* Esta usa el componente visual */}
          <Route path="clases/:claseId/gestionar" element={<AdminGestionAlumnosClase />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;