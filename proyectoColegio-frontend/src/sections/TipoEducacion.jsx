import { motion } from "framer-motion";
import { BookOpenCheck, Calculator, BriefcaseBusiness, ClipboardList, GraduationCap } from "lucide-react";

const MotionDiv = motion.div;

const educacionSteps = [
  {
    icon: <BookOpenCheck className="w-8 h-8 text-secondary" />,
    title: "Formación General",
    text: "Desarrollamos habilidades fundamentales en lengua, matemática, ciencias y ciudadanía.",
  },
  {
    icon: <Calculator className="w-8 h-8 text-secondary" />,
    title: "Orientación Contable",
    text: "Introducción al análisis contable, registros, balances y documentación comercial.",
  },
  {
    icon: <BriefcaseBusiness className="w-8 h-8 text-secondary" />,
    title: "Administración",
    text: "Gestión de empresas, marketing, recursos humanos y simuladores de negocios.",
  },
  {
    icon: <ClipboardList className="w-8 h-8 text-secondary" />,
    title: "Proyectos Reales",
    text: "Participación en ferias, prácticas simuladas y elaboración de planes de negocio.",
  },
  {
    icon: <GraduationCap className="w-8 h-8 text-secondary" />,
    title: "Futuro Profesional",
    text: "Preparación para el ámbito universitario o laboral con una sólida base práctica.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const TipoEducacion = () => {
  return (
    <section id="tipo-educacion" className="scroll-mt-20 bg-white px-4 py-14 text-accent sm:px-6 sm:py-20 lg:px-20">
      <h2 className="mb-10 text-center text-3xl font-bold sm:mb-16">Tipo de Educación</h2>
      <MotionDiv
        className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        {educacionSteps.map((step, index) => (
          <MotionDiv
            key={index}
            variants={itemVariants}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 rounded-full bg-primary p-4 shadow">{step.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-sm text-gray-700">{step.text}</p>
          </MotionDiv>
        ))}
      </MotionDiv>
    </section>
  );
};

export default TipoEducacion;
