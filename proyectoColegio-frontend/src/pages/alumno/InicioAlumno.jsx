import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  BookOpen, 
  ClipboardList, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Bell, 
  ArrowRight,
  GraduationCap
} from "lucide-react";

// Puedes importar aquí tus llamadas a la API si quieres datos reales
// import { getMisClasesAlumno, getAnunciosAlumno } from "../../api/api";

const InicioAlumno = () => {
  const { usuario } = useAuth();
  const [fechaHoy, setFechaHoy] = useState("");

  useEffect(() => {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setFechaHoy(new Date().toLocaleDateString('es-ES', opciones));
  }, []);

  // --- DATOS MOCK (SIMULADOS) ---
  // Luego reemplazarás esto con useEffect y las llamadas a tu API
  const clasesHoy = [
    { id: 1, materia: "Matemáticas", hora: "08:00 - 09:30", aula: "Aula 101" },
    { id: 2, materia: "Historia", hora: "09:45 - 11:15", aula: "Aula 204" },
    { id: 3, materia: "Inglés", hora: "11:30 - 13:00", aula: "Lab 2" },
  ];

  const anunciosRecientes = [
    { id: 1, titulo: "Feria de Ciencias", mensaje: "Recuerden inscribirse antes del viernes.", fecha: "Hace 2 horas", tipo: "info" },
    { id: 2, titulo: "Suspensión de Ed. Física", mensaje: "Por lluvia se suspende la actividad.", fecha: "Ayer", tipo: "alert" },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50/50 space-y-8">
      
      {/* --- 1. HEADER DE BIENVENIDA --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Hola, <span className="text-blue-600">{usuario?.nombre || "Estudiante"}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1 capitalize">{fechaHoy}</p>
        </div>
        <div className="hidden md:block">
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 shadow-sm">
                Año Lectivo 2024
            </span>
        </div>
      </div>

      {/* --- 2. TARJETAS DE RESUMEN (KPIs) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<BookOpen size={24} />} 
          label="Materias Inscriptas" 
          value="8" 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={<ClipboardList size={24} />} 
          label="Tareas Pendientes" 
          value="3" 
          color="bg-amber-500" 
        />
        <StatCard 
          icon={<GraduationCap size={24} />} 
          label="Promedio General" 
          value="8.5" 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={<CalendarIcon size={24} />} 
          label="Asistencia Global" 
          value="92%" 
          color="bg-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUMNA IZQUIERDA (PRINCIPAL) --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Sección: Agenda del Día */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="text-blue-600" size={20}/> Tu Agenda de Hoy
              </h2>
              <Link to="/alumno/clases" className="text-sm text-blue-600 hover:underline">Ver semana completa</Link>
            </div>
            <div className="p-6">
              {clasesHoy.length > 0 ? (
                <div className="space-y-4">
                  {clasesHoy.map((clase) => (
                    <div key={clase.id} className="flex items-center p-4 rounded-xl bg-gray-50 border-l-4 border-blue-500 hover:bg-blue-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{clase.materia}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={14}/> {clase.hora}</span>
                          <span className="flex items-center gap-1"><MapPin size={14}/> {clase.aula}</span>
                        </div>
                      </div>
                      <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">¡Hoy no tienes clases asignadas! 🎉</p>
              )}
            </div>
          </section>

          {/* Sección: Últimos Anuncios */}
          <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="text-amber-500" size={20}/> Novedades Recientes
                </h2>
                <Link to="/alumno/anuncios" className="text-sm text-gray-500 hover:text-gray-800">Ver todas</Link>
            </div>
            <div className="grid gap-4">
                {anunciosRecientes.map((anuncio) => (
                    <div key={anuncio.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800">{anuncio.titulo}</h3>
                            <span className="text-xs text-gray-400">{anuncio.fecha}</span>
                        </div>
                        <p className="text-gray-600 mt-2 text-sm">{anuncio.mensaje}</p>
                    </div>
                ))}
            </div>
          </section>

        </div>

        {/* --- COLUMNA DERECHA (LATERAL) --- */}
        <div className="space-y-8">
          
          {/* Accesos Rápidos Mejorados */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Accesos Directos</h3>
            <div className="grid grid-cols-2 gap-3">
               
                <QuickBtn to="/alumno/boletin" icon={<BookOpen size={18}/>} label="Boletín" />
                <QuickBtn to="/alumno/asistencias" icon={<CalendarIcon size={18}/>} label="Asistencia" />
                {/* Agrega más si necesitas */}
            </div>
          </div>

          {/* Widget de Calendario (Simplificado o el componente completo) */}
          {/* Si CalendarioAlumno es muy grande, considera ocultarlo en mobile o simplificarlo */}
           {/* <CalendarioAlumno />  <-- Descomenta si quieres mostrar el calendario completo aquí */}
           
           {/* Banner Promocional o Aviso Fijo */}
           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2">Próximo Examen</h3>
                  <p className="text-blue-100 text-sm mb-4">No olvides prepararte para Matemáticas este Viernes.</p>
                  <button className="bg-white text-blue-700 text-xs font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-50 transition">
                      Ver Temario
                  </button>
              </div>
              {/* Elemento decorativo */}
              <div className="absolute -bottom-4 -right-4 bg-white/10 w-24 h-24 rounded-full blur-xl"></div>
           </div>

        </div>
      </div>
    </div>
  );
};

// --- Subcomponentes para mantener el código limpio ---

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
    <div className={`p-3 rounded-lg text-white shadow-sm ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const QuickBtn = ({ to, icon, label }) => (
    <Link to={to} className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors group border border-gray-100">
        <div className="text-gray-400 group-hover:text-blue-500 mb-2 transition-colors">
            {icon}
        </div>
        <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">{label}</span>
    </Link>
);

export default InicioAlumno;