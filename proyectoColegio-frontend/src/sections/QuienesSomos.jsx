import { motion } from "framer-motion";

const QuienesSomos = () => {
  return (
    <section className="bg-secondary text-white py-20 px-6 md:px-20" id="quienes-somos">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-6 text-white">¿Quiénes somos?</h2>
        <p className="text-md text-gray-100 leading-relaxed">
          Somos una institución educativa con más de <strong className="text-primary">30 años</strong> de trayectoria. Brindamos una educación con valores humanos,
          excelencia académica y orientación al mundo real. Nuestro compromiso es formar personas <span className="text-primary font-semibold">íntegras y capaces</span> de afrontar los desafíos del futuro.
        </p>
      </motion.div>
    </section>
  );
};

export default QuienesSomos;
