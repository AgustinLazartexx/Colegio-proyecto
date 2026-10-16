import { Briefcase, TrendingUp, Users, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

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
    <section id="valores" className="scroll-mt-20 bg-white px-4 py-14 text-accent sm:px-6 sm:py-16 lg:px-12">
      <h2 className="mb-10 text-center text-3xl font-bold sm:mb-12">Nuestros Valores</h2>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-7 xl:grid-cols-4">
        {valores.map((valor, index) => (
          <MotionDiv
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
          </MotionDiv>
        ))}
      </div>
    </section>
  );
};

export default Valores;
