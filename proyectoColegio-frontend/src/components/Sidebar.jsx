// src/components/Sidebar.jsx
import { Home, Calendar, Users, BookOpen, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-accent text-white p-6 space-y-6">
      <div className="text-2xl font-bold mb-10">Panel</div>

      <nav className="space-y-4">
        <Link to="#" className="flex items-center gap-3 hover:text-secondary">
          <Home size={20} /> Inicio
        </Link>
        <Link to="#" className="flex items-center gap-3 hover:text-secondary">
          <Calendar size={20} /> Calendario
        </Link>
        <Link to="#" className="flex items-center gap-3 hover:text-secondary">
          <BookOpen size={20} /> Materias
        </Link>
        <Link to="#" className="flex items-center gap-3 hover:text-secondary">
          <ClipboardList size={20} /> Tareas
        </Link>
        <Link to="#" className="flex items-center gap-3 hover:text-secondary">
          <Users size={20} /> Comunidad
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
