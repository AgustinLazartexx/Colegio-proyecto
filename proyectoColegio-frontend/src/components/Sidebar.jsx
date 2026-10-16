// src/components/Sidebar.jsx
import { Home, Calendar, Users, BookOpen, ClipboardList } from "lucide-react";
import { HiMenuAlt3 } from "react-icons/hi";
import { Link } from "react-router-dom";

const Sidebar = ({ isOpen, setIsOpen }) => {
  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-blue-800 text-white transition-all duration-300 z-50 
      ${isOpen ? 'w-64' : 'w-20'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        <span className={`font-bold transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
          COLEGIO
        </span>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <HiMenuAlt3 size={24} />
        </button>
      </div>

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
