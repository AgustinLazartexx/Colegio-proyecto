import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

const links = [
  { label: "Propuesta", targetId: "propuesta" },
  { label: "Contacto", targetId: "contacto" },
  { label: "Tipo de Educación", targetId: "tipo-educacion" },
];

/**
 * Navbar profesional para el landing page.
 * @param {object} props
 * @param {function} props.onLoginClick - Función para abrir el modal de login.
 */
const Navbar = ({ onLoginClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Maneja el clic en un enlace del navbar.
   * Si está en la página de inicio, se desplaza suavemente.
   * Si está en otra página, navega a la inicio y luego se desplaza.
   */
  const handleLinkClick = (id) => {
    if (location.pathname !== "/") {
      navigate("/", { replace: false });
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); // Espera 100ms para que ocurra la navegación
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    // CAMBIO: Fondo semitransparente con efecto blur y un borde sutil
    <nav className="bg-accent/90 backdrop-blur-lg text-white fixed w-full top-0 z-50 shadow-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <motion.div
          className="flex items-center gap-3 text-xl font-bold cursor-pointer group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => handleLinkClick("hero")}
        >
          <img src="/img/Logodelsol.png" alt="logo" className="w-8 h-8" />
          {/* CAMBIO: Transición de opacidad en el texto al hacer hover */}
          <span className="text-white group-hover:text-white/80 transition-colors duration-300">
            Colegio Reina de la Esperanza
          </span>
        </motion.div>

        {/* LINKS */}
        <ul className="hidden md:flex gap-6 font-medium">
          {links.map((link, i) => (
            <motion.li
              key={link.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.15 }}
              // CAMBIO: Transición de color más suave
              className="hover:text-secondary transition-colors duration-300 cursor-pointer"
              onClick={() => handleLinkClick(link.targetId)}
            >
              {link.label}
            </motion.li>
          ))}
        </ul>

        {/* BOTÓN DE LOGIN */}
        <div>
          <motion.button
            onClick={onLoginClick}
            // CAMBIO: Transición suave y efecto de escala al hacer hover
            className="flex items-center gap-2 bg-secondary hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out hover:scale-105"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <LogIn size={18} /> Iniciar Sesión
          </motion.button>
          
          {/* BOTÓN DE REGISTRO ELIMINADO */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;