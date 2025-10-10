// src/pages/alumno/InicioAlumno.jsx
import { BookOpen, ClipboardList, FileText, CalendarCheck, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import CalendarioAlumno from "../../components/alumno/CalendarioAlumno";

const InicioAlumno = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-accent">¡Bienvenido/a al portal del estudiante!</h1>
      <p className="text-gray-700">Aquí podés ver un resumen general de tu actividad académica.</p>

      {/* Paneles resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<BookOpen />} label="Materias" value="8" color="bg-blue-100" />
        <Card icon={<ClipboardList />} label="Tareas pendientes" value="2" color="bg-yellow-100" />
        <Card icon={<FileText />} label="Exámenes próximos" value="1" color="bg-purple-100" />
        <Card icon={<CalendarCheck />} label="Asistencia" value="92%" color="bg-green-100" />
      </div>

      {/* Próximo evento */}
      <div className="bg-white p-4 shadow rounded-lg">
        <h2 className="text-lg font-semibold text-accent">📅 Próximo evento</h2>
        <p className="text-gray-700 mt-2">🧮 Examen de Matemática — Viernes 21/06 — 10:00 AM</p>
      </div>

      {/* Mensajes destacados */}
      <div className="bg-white p-4 shadow rounded-lg">
        <h2 className="text-lg font-semibold text-accent flex items-center gap-2">
          <MessageSquare size={20} /> Mensajes del colegio
        </h2>
        <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-1">
          <li>Recordá traer tu cuaderno de comunicaciones firmado.</li>
          <li>El lunes no hay clases por jornada institucional.</li>
        </ul>
      </div>

      {/* Accesos rápidos */}
      <div className="flex flex-wrap gap-4">
        <QuickLink to="/alumno/tareas" label="Ir a Tareas" />
        <QuickLink to="/alumno/examenes" label="Ir a Exámenes" />
        <QuickLink to="/alumno/asistencia" label="Ver Asistencia" />
        <QuickLink to="/alumno/materias" label="Ver Materias" />
      </div>

      {/* Calendario */}
      <div className="bg-white p-4 shadow rounded-lg mt-4">
        <h2 className="text-lg font-semibold text-accent mb-2">📆 Calendario de Actividades</h2>
        <CalendarioAlumno />
      </div>
    </div>
  );
};

const Card = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-lg shadow ${color} flex items-center gap-4`}>
    <div className="bg-white p-2 rounded-full text-accent">{icon}</div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <h3 className="text-xl font-bold">{value}</h3>
    </div>
  </div>
);

const QuickLink = ({ to, label }) => (
  <Link
    to={to}
    className="bg-accent text-white px-4 py-2 rounded-full hover:bg-secondary transition text-sm"
  >
    {label}
  </Link>
);

export default InicioAlumno;
