import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

const MotionFooter = motion.footer;

const Footer = () => {
  return (
    <MotionFooter
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="bg-accent px-4 py-10 text-primary sm:px-6 sm:py-12 md:px-16"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
        {/* Columna 1 - Sobre el colegio */}
        <div>
          <h3 className="text-xl font-bold mb-4">Colegio Reina de la Esperanza</h3>
          <p className="text-sm text-gray-200">
            Una institución comprometida con la formación integral de jóvenes
            preparados para el mundo profesional.
          </p>
        </div>

        {/* Columna 2 - Enlaces rápidos */}
        <div>
          <h3 className="text-xl font-bold mb-4">Enlaces</h3>
          <ul className="space-y-2 text-sm text-gray-100">
            <li><a href="#quienes-somos" className="rounded-sm hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">Quiénes somos</a></li>
            <li><a href="#propuesta" className="rounded-sm hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">Propuesta educativa</a></li>
            <li><a href="#valores" className="rounded-sm hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">Valores</a></li>
            <li><a href="#contacto" className="rounded-sm hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">Inscripciones y consultas</a></li>
          </ul>
        </div>

        {/* Columna 3 - Contacto */}
        <div>
          <h3 className="text-xl font-bold mb-4">Contacto</h3>
          <ul className="space-y-3 text-sm text-gray-100">
            <li className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-white" />
              <span className="break-words">San Martín 332 Este El Manantial (ruta 38-km. 1539)</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-white" />
              <a href="tel:+5493814557943" className="break-all underline underline-offset-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
                +54 9 3814557943
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-white" />
              <a href="mailto:contacto@colegiomariareina.edu.ar" className="break-all underline underline-offset-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
                contacto@colegiomariareina.edu.ar
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-gray-300">
        © {new Date().getFullYear()} Colegio Reina de la Esperanza. Todos los derechos reservados.
      </div>
    </MotionFooter>
  );
};

export default Footer;
