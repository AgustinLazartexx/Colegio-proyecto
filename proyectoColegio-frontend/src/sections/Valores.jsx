import { Briefcase, TrendingUp, Users, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

const valores = [
  {
    icon: <GraduationCap className="w-10 h-10 text-secondary" />,
    title: "Educación de calidad",
    description: "Formamos estudiantes con base sólida para el mundo profesional y universitario.",
  },
  {
    icon: <Briefcase className="w-10 h-10 text-secondary" />,
    title: "Orientación empresarial",
    description: "Especializados en contabilidad y administración para construir futuros emprendedores.",
  },
  {
    icon: <TrendingUp className="w-10 h-10 text-secondary" />,
    title: "Herramientas para el futuro",
    description: "Inculcamos el pensamiento crítico, la planificación y la toma de decisiones.",
  },
  {
    icon: <Users className="w-10 h-10 text-secondary" />,
    title: "Comunidad y respeto",
    description: "Fomentamos el trabajo en equipo, la inclusión y el respeto mutuo.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

const Valores = () => {
  return (
    <section className="py-16 px-6 md:px-12 bg-white text-accent">
      <h2 className="text-3xl font-bold text-center mb-12">Nuestros Valores</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {valores.map((valor, index) => (
          <motion.div
            key={index}
            className="bg-primary p-6 rounded-xl shadow hover:shadow-lg transition duration-300"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={index}
          >
            <div className="flex justify-center mb-4">{valor.icon}</div>
            <h3 className="text-xl font-semibold text-center mb-2">{valor.title}</h3>
            <p className="text-center text-sm text-gray-700">{valor.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Valores;
