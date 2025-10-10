import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

const links = [
  { label: "Inicio", targetId: "hero" },
  { label: "Propuesta", targetId: "propuesta" },
  { label: "Contacto", targetId: "contacto" },
];

const Navbar = ({ onLoginClick, onRegisterClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLinkClick = (id) => {
    if (location.pathname !== "/") {
      navigate("/", { replace: false });
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="bg-accent text-white fixed w-full top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <motion.div
          className="flex items-center gap-3 text-lg font-bold cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => handleLinkClick("hero")}
        >
          <img src="/img/Logodelsol.png" alt="logo" className="w-8 h-8" />
          <span className="text-white">Academia Secundaria Del Sol</span>
        </motion.div>

        {/* LINKS */}
        <ul className="hidden md:flex gap-6 font-medium">
          {links.map((link, i) => (
            <motion.li
              key={link.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.15 }}
              className="hover:text-secondary transition cursor-pointer"
              onClick={() => handleLinkClick(link.targetId)}
            >
              {link.label}
            </motion.li>
          ))}
        </ul>

        {/* BOTONES */}
        <div className="flex gap-2">
          <motion.button
            onClick={onLoginClick}
            className="flex items-center gap-2 bg-secondary hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <LogIn size={18} /> Iniciar Sesión
          </motion.button>

          <motion.button
            onClick={onRegisterClick}
            className="px-4 py-2 bg-white text-accent font-semibold rounded-full hover:bg-gray-100 text-sm transition"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Registrarse
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
