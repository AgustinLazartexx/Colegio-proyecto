// src/pages/profesor/InicioProfesor.jsx
import { CalendarDays, ClipboardCheck, BookOpen, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const InicioProfesor = () => {
  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      {/* Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-accent">👋 ¡Bienvenido/a Profesor/a!</h1>
        <p className="text-gray-600 mt-1 text-lg">
          Aquí tienes un resumen de tu día y accesos rápidos a tus herramientas.
        </p>
      </div>

      {/* Paneles resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          icon={<BookOpen className="h-6 w-6" />}
          label="Clases de hoy"
          value="3"
          color="bg-blue-100 text-blue-800"
        />
        <Card
          icon={<ClipboardCheck className="h-6 w-6" />}
          label="Tareas por corregir"
          value="5"
          color="bg-yellow-100 text-yellow-800"
        />
        <Card
          icon={<CalendarDays className="h-6 w-6" />}
          label="Eventos próximos"
          value="2"
          color="bg-purple-100 text-purple-800"
        />
        <Card
          icon={<Mail className="h-6 w-6" />}
          label="Mensajes nuevos"
          value="1"
          color="bg-green-100 text-green-800"
        />
      </div>

      {/* Próxima clase */}
      <div className="bg-white p-6 shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition">
        <h2 className="text-xl font-semibold text-accent flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Próxima clase
        </h2>
        <p className="text-gray-700 mt-2 text-lg font-medium">
          📘 Lengua y Literatura — <span className="font-semibold">11:00 AM</span> — Aula <span className="font-semibold">3°B</span>
        </p>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h3 className="text-lg font-semibold text-accent mb-3">Accesos rápidos</h3>
        <div className="flex flex-wrap gap-4">
          <QuickLink to="/profesor/clases" label="📚 Ver Clases" />
          <QuickLink to="/profesor/asistencia" label="📝 Cargar Asistencia" />
          <QuickLink to="/profesor/mensajes" label="✉️ Ver Mensajes" />
        </div>
      </div>
    </div>
  );
};

const Card = ({ icon, label, value, color }) => (
  <div
    className={`p-5 rounded-xl shadow-md flex items-center gap-4 hover:shadow-lg transition ${color}`}
  >
    <div className="bg-white p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm opacity-80">{label}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </div>
);

const QuickLink = ({ to, label }) => (
  <Link
    to={to}
    className="bg-accent text-white px-5 py-2 rounded-full hover:bg-secondary transition text-sm shadow-md hover:shadow-lg"
  >
    {label}
  </Link>
);

export default InicioProfesor;
