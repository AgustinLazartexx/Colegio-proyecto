import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  CalendarDays, 
  ClipboardCheck, 
  BookOpen, 
  Mail, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight,
  GraduationCap 
} from "lucide-react";

// Puedes usar tu hook de auth si quieres el nombre real
// import { useAuth } from "../../context/AuthContext";

const InicioProfesor = () => {
  // const { usuario } = useAuth(); // Si tienes el contexto
  const [fechaHoy, setFechaHoy] = useState("");

  useEffect(() => {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setFechaHoy(new Date().toLocaleDateString('es-ES', opciones));
  }, []);

  return (
    <div className="p-8 min-h-screen bg-gray-50/50 space-y-8 animate-in fade-in duration-500">
      
      {/* --- 1. HEADER CON FECHA --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Hola, <span className="text-indigo-600">Profesor/a</span> 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg capitalize font-medium">
            {fechaHoy}
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 text-sm text-gray-600 font-medium">
            Ciclo Lectivo 2024
        </div>
      </div>

      {/* --- 2. KPIs (Indicadores Clave) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<BookOpen size={24} />}
          label="Clases de hoy"
          value="3"
          color="bg-blue-500"
          subtext="2 por la mañana"
        />
        <StatCard
          icon={<ClipboardCheck size={24} />}
          label="Por Corregir"
          value="12"
          color="bg-amber-500"
          subtext="Tareas pendientes"
        />
        <StatCard
          icon={<CalendarDays size={24} />}
          label="Eventos"
          value="1"
          color="bg-purple-500"
          subtext="Próx: Reunión de padres"
        />
        <StatCard
          icon={<Mail size={24} />}
          label="Mensajes"
          value="4"
          color="bg-emerald-500"
          subtext="2 sin leer"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- 3. SECCIÓN PRINCIPAL: PRÓXIMA CLASE --- */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="text-indigo-600" size={22}/> En Agenda
            </h2>
            
            {/* Tarjeta Hero de Próxima Clase */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            En 20 minutos
                        </span>
                        <Link to="/profesor/clases" className="text-gray-400 hover:text-indigo-600 transition">
                            <ArrowRight size={24} />
                        </Link>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 group-hover:text-indigo-700 transition-colors">
                        Lengua y Literatura
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 md:gap-8 mt-6">
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-gray-100 rounded-lg text-indigo-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Horario</p>
                                <p className="font-semibold">11:00 - 12:30</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-gray-100 rounded-lg text-indigo-600">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Ubicación</p>
                                <p className="font-semibold">Aula 3°B - Piso 1</p>
                            </div>
                        </div>

                         <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-gray-100 rounded-lg text-indigo-600">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Alumnos</p>
                                <p className="font-semibold">24 Inscritos</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Botón de acción rápida dentro de la tarjeta */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                    <Link to="/profesor/tomar-asistencia" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        Iniciar Clase y Tomar Asistencia <ArrowRight size={16}/>
                    </Link>
                </div>
            </div>
        </div>

        {/* --- 4. ACCESOS RÁPIDOS --- */}
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <GraduationCap className="text-indigo-600" size={22}/> Gestión Rápida
            </h2>
            <div className="grid gap-4">
                <ActionCard 
                    to="/profesor/clases" 
                    label="Mis Clases" 
                    desc="Ver cronograma semanal"
                    icon={<CalendarDays size={20}/>} 
                />
                <ActionCard 
                    to="/profesor/tomar-asistencia" 
                    label="Asistencia" 
                    desc="Registrar presentes y ausentes"
                    icon={<ClipboardCheck size={20}/>} 
                />
                <ActionCard 
                    to="/profesor/cargar-tarea" 
                    label="Nueva Tarea" 
                    desc="Crear actividad para alumnos"
                    icon={<BookOpen size={20}/>} 
                />
                 <ActionCard 
                    to="/profesor/mensajes" 
                    label="Comunicados" 
                    desc="Enviar avisos al curso"
                    icon={<Mail size={20}/>} 
                />
            </div>
        </div>

      </div>
    </div>
  );
};

// --- Subcomponentes Estilizados ---

const StatCard = ({ icon, label, value, color, subtext }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className="flex justify-between items-start">
        <div>
             <p className="text-sm font-semibold text-gray-500">{label}</p>
             <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl text-white shadow-sm ${color}`}>
            {icon}
        </div>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-400 font-medium">{subtext}</p>
    </div>
  </div>
);

const ActionCard = ({ to, label, desc, icon }) => (
    <Link 
        to={to} 
        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-sm hover:shadow"
    >
        <div className="p-3 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-white group-hover:text-indigo-600 transition-colors shadow-sm">
            {icon}
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{label}</h4>
            <p className="text-xs text-gray-500">{desc}</p>
        </div>
        <div className="text-gray-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1">
            <ArrowRight size={18} />
        </div>
    </Link>
);

export default InicioProfesor;