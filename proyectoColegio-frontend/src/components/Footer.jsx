import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="bg-accent text-primary py-12 px-6 md:px-16"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
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
          <ul className="space-y-2 text-sm text-gray-200">
            <li><a href="#quienes-somos" className="hover:text-secondary">Quiénes somos</a></li>
            <li><a href="#propuesta" className="hover:text-secondary">Propuesta educativa</a></li>
            <li><a href="#valores" className="hover:text-secondary">Valores</a></li>
            <li><a href="#contacto" className="hover:text-secondary">Contacto</a></li>
          </ul>
        </div>

        {/* Columna 3 - Contacto */}
        <div>
          <h3 className="text-xl font-bold mb-4">Contacto</h3>
          <ul className="space-y-2 text-sm text-gray-200">
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-secondary" />
              San Martín 332 Este El Manantial (ruta 38-km. 1539)
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-secondary" />
               +54 9 3814557943
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-secondary" />
              contacto@colegiomariareina.edu.ar
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-gray-300">
        © {new Date().getFullYear()} Colegio Reina de la Esperanza. Todos los derechos reservados.
      </div>
    </motion.footer>
  );
};

export default Footer;
