import { motion } from "framer-motion";
import { School } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-primary min-h-[80vh] flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-20 py-10 md:py-20">
      {/* Texto principal */}
      <motion.div
        className="md:w-1/2 text-center md:text-left"
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-accent mb-4">
          Academia Secundaria Del Sol
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Formación integral con orientación en <span className="text-secondary font-semibold">Contabilidad</span> y <span className="text-secondary font-semibold">Administración de Empresas</span>.
        </p>
        <a
          href="#contacto"
          className="inline-flex items-center bg-secondary text-white px-6 py-3 rounded-md hover:bg-red-700 transition"
        >
          <School className="w-5 h-5 mr-2" />
          Conocé nuestra propuesta
        </a>
      </motion.div>

      {/* Imagen institucional */}
      <motion.div
        className="md:w-1/2 mb-10 md:mb-0"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <img
          src="img/colegiofic.png"
          alt="Fachada del colegio"
          className="w-full h-auto max-h-[400px] object-cover rounded-xl shadow"
        />
      </motion.div>
    </section>
  );
};

export default Hero;
