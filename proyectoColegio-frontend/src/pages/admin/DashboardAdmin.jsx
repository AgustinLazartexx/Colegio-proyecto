import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  UserPlus, 
  ClipboardCheck, 
  School,
  Bell,
  ArrowRight
} from "lucide-react";
// Importamos las funciones de API para llenar los datos reales
import { getUsuarios, getMaterias, getTodasLasClases } from "../../api/api";

const DashboardAdmin = () => {
  const { usuario } = useAuth();
  
  // Estados para los contadores (KPIs)
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    totalProfesores: 0,
    totalMaterias: 0,
    totalClases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        // Hacemos las peticiones en paralelo para que cargue rápido
        const [resUsers, resMaterias, resClases] = await Promise.all([
          getUsuarios(),       // Trae todos los usuarios
          getMaterias(),       // Trae todas las materias
          getTodasLasClases()  // Trae todas las clases
        ]);

        // Filtramos los usuarios para contar por rol
        const alumnos = resUsers.data.filter(u => u.rol === 'alumno').length;
        const profesores = resUsers.data.filter(u => u.rol === 'profesor').length;

        setStats({
          totalAlumnos: alumnos,
          totalProfesores: profesores,
          totalMaterias: resMaterias.data.length || 0,
          totalClases: resClases.data.length || 0
        });

      } catch (error) {
        console.error("Error cargando stats:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  const fechaHoy = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50/50 space-y-8">
      
      {/* --- 1. HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Panel de Administración
          </h1>
          <p className="text-gray-500 mt-1 capitalize">
            {fechaHoy} • Hola, {usuario?.nombre}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Link to="/admin/crud-anuncios" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                <Bell size={18} /> Anuncios
            </Link>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition font-medium">
                Generar Reporte
            </button>
        </div>
      </div>

      {/* --- 2. KPIs (Tarjetas de Estadísticas) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Alumnos Activos" 
          value={loading ? "..." : stats.totalAlumnos} 
          icon={<Users size={24}/>} 
          color="bg-blue-500" 
          subtext="Registrados en el sistema"
        />
        <StatCard 
          title="Profesores" 
          value={loading ? "..." : stats.totalProfesores} 
          icon={<School size={24}/>} 
          color="bg-emerald-500" 
          subtext="Docentes asignados"
        />
        <StatCard 
          title="Materias" 
          value={loading ? "..." : stats.totalMaterias} 
          icon={<BookOpen size={24}/>} 
          color="bg-purple-500" 
          subtext="Plan de estudios"
        />
        <StatCard 
          title="Clases Creadas" 
          value={loading ? "..." : stats.totalClases} 
          icon={<Calendar size={24}/>} 
          color="bg-amber-500" 
          subtext="Horarios configurados"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- 3. ACCESOS RÁPIDOS (Gestión) --- */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600"/> Gestión Rápida
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta de Acción: Usuarios */}
            <ActionCard 
              to="/admin/usuarios"
              title="Gestionar Usuarios"
              desc="Crear, editar o eliminar alumnos y profesores."
              icon={<UserPlus size={20} />}
              color="text-blue-600 bg-blue-50"
            />

            {/* Tarjeta de Acción: Materias */}
            <ActionCard 
              to="/admin/materias"
              title="Catálogo de Materias"
              desc="Administrar asignaturas y programas."
              icon={<BookOpen size={20} />}
              color="text-purple-600 bg-purple-50"
            />

            {/* Tarjeta de Acción: Clases */}
            <ActionCard 
              to="/admin/CrearClases"
              title="Configurar Clases"
              desc="Asignar horarios, aulas y profesores."
              icon={<Calendar size={20} />}
              color="text-amber-600 bg-amber-50"
            />

            {/* Tarjeta de Acción: Asistencia */}
            <ActionCard 
              to="/admin/AsistenciaGestion"
              title="Control de Asistencia"
              desc="Supervisar o tomar asistencia manualmente."
              icon={<ClipboardCheck size={20} />}
              color="text-emerald-600 bg-emerald-50"
            />
          </div>
        </div>

        {/* --- 4. PANEL LATERAL (Estado del Sistema) --- */}
        <div className="space-y-6">
          
          {/* Estado de cuotas (Mockup por ahora) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Estado Financiero</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cuotas al día</span>
                    <span className="text-sm font-bold text-green-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-400">Actualizado hace 10 min</p>
                </div>
            </div>
          </div>

          {/* Auditoría reciente (Ejemplo visual) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-4">Actividad Reciente</h3>
             <ul className="space-y-3">
                <ActivityItem text="Prof. Gomez subió notas de 5to A" time="Hace 5 min" />
                <ActivityItem text="Nuevo alumno registrado: Juan P." time="Hace 20 min" />
                <ActivityItem text="Asistencia 3ro B completada" time="Hace 1h" />
             </ul>
             <div className="mt-4 pt-2 border-t border-gray-50 text-center">
                <Link to="/admin/AuditoriaNotas" className="text-sm text-blue-600 font-medium hover:underline">
                    Ver auditoría completa
                </Link>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Subcomponentes ---

const StatCard = ({ title, value, icon, color, subtext }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
    <div className={`p-3 rounded-lg text-white shadow-sm ${color}`}>
      {icon}
    </div>
  </div>
);

const ActionCard = ({ to, title, desc, icon, color }) => (
  <Link to={to} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
    <div className={`p-3 rounded-lg ${color}`}>
        {icon}
    </div>
    <div className="flex-1">
        <h4 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
    <ArrowRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={18} />
  </Link>
);

const ActivityItem = ({ text, time }) => (
    <li className="flex items-start gap-3 text-sm">
        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
        <div>
            <p className="text-gray-700">{text}</p>
            <span className="text-xs text-gray-400">{time}</span>
        </div>
    </li>
);

export default DashboardAdmin;