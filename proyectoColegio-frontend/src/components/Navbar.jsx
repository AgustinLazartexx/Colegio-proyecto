import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Menu, X } from "lucide-react";

const MotionButton = motion.button;

const links = [
  { label: "Propuesta educativa", targetId: "propuesta" },
  { label: "Nuestra comunidad", targetId: "quienes-somos" },
  { label: "Inscripciones y consultas", targetId: "contacto" },
];

const Navbar = ({ onLoginClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = (id) => {
    setMenuOpen(false);
    const scrollToSection = () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(id)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };
    if (location.pathname !== "/") {
      navigate("/", { replace: false });
      window.setTimeout(scrollToSection, 100);
      return;
    }
    scrollToSection();
  };

  const openLogin = () => {
    setMenuOpen(false);
    onLoginClick();
  };

  return (
    <nav aria-label="Navegación principal" className="fixed top-0 z-50 w-full border-b border-slate-200/70 bg-white/90 text-[#10233f] shadow-sm backdrop-blur-xl">
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-md bg-white px-4 py-3 text-[#10233f] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => handleLinkClick("hero")}
          className="group flex items-center gap-3 text-left"
          aria-label="Ir al inicio"
        >
          <img
            src="/img/Logodelsol.png"
            alt=""
            className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
          />
          <span className="max-w-[190px] text-sm font-bold leading-tight sm:max-w-none sm:text-base">
            Colegio Reina de la Esperanza
          </span>
        </button>

        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map(({ label, targetId }) => (
            <button
              key={targetId}
              type="button"
              onClick={() => handleLinkClick(targetId)}
              className="rounded-sm text-sm font-medium text-slate-700 transition hover:text-[#193CB8] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              {label}
            </button>
          ))}
          <MotionButton
            type="button"
            onClick={openLogin}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full bg-[#193CB8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/15 transition hover:bg-[#142f91] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          >
            <LogIn size={17} aria-hidden="true" />
            Iniciar sesión
          </MotionButton>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-100 bg-white px-5 pb-5 pt-2 shadow-lg lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map(({ label, targetId }) => (
              <button
                key={targetId}
                type="button"
                onClick={() => handleLinkClick(targetId)}
                className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-[#193CB8] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={openLogin}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#193CB8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#142f91] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              <LogIn size={17} aria-hidden="true" />
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
