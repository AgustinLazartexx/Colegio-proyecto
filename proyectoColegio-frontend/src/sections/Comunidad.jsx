import { motion } from "framer-motion";
import { HeartHandshake, UsersRound, School } from "lucide-react";

const comunidadData = [
  {
    icon: <UsersRound className="w-10 h-10 text-secondary" />,
    title: "Participación activa",
    text: "Promovemos el trabajo conjunto entre alumnos, familias y docentes para construir comunidad.",
  },
  {
    icon: <HeartHandshake className="w-10 h-10 text-secondary" />,
    title: "Solidaridad y valores",
    text: "Fomentamos acciones solidarias y proyectos sociales que vinculan al colegio con su entorno.",
  },
  {
    icon: <School className="w-10 h-10 text-secondary" />,
    title: "Vida escolar completa",
    text: "Ofrecemos talleres, deportes, arte y espacios de expresión que enriquecen la experiencia escolar.",
  },
];

const fadeIn = {
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

const Comunidad = () => {
  return (
    <section className="py-16 px-6 md:px-12 bg-primary text-accent">
      <h2 className="text-3xl font-bold text-center mb-12">Nuestra Comunidad</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {comunidadData.map((item, index) => (
          <motion.div
            key={index}
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-300"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={index}
          >
            <div className="flex justify-center mb-4">{item.icon}</div>
            <h3 className="text-xl font-semibold text-center mb-2">{item.title}</h3>
            <p className="text-center text-gray-700 text-sm">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Comunidad;
