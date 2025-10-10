import { useState } from "react";
import { motion } from "framer-motion";

const tabs = [
  {
    id: "primaria",
    title: "Primaria",
    img: "/img/colegio1.jpg",
    heading: "Cimientos Sólidos para el Futuro",
    description:
      "Nuestro programa de primaria se enfoca en el aprendizaje a través del descubrimiento. Fomentamos la curiosidad innata de los niños en un entorno bilingüe.",
    features: [
      "Aprendizaje Basado en Proyectos.",
      "Programa de inmersión en inglés.",
      "Desarrollo de habilidades socioemocionales.",
    ],
  },
  {
    id: "secundaria",
    title: "Secundaria",
    img: "/img/colegio4.jpg",
    heading: "Desarrollando Pensamiento Crítico",
    description:
      "En secundaria, desafiamos a los estudiantes con un currículo riguroso, preparando para el bachillerato y la universidad.",
    features: [
      "Preparación para exámenes internacionales.",
      "Laboratorios de ciencia y tecnología.",
      "Programas de liderazgo y debate.",
    ],
  },
  {
    id: "vida",
    title: "Vida Estudiantil",
    heading: "Más Allá del Aula",
    description:
      "Creemos en una educación holística. Las actividades extracurriculares permiten a los estudiantes explorar sus pasiones y trabajar en equipo.",
    items: [
      { icon: "⚽", title: "Deportes" },
      { icon: "🎨", title: "Artes" },
      { icon: "🤖", title: "Tecnología" },
      { icon: "🌍", title: "Voluntariado" },
    ],
  },
];

export default function PropuestaEducativa() {
  const [activeTab, setActiveTab] = useState("primaria");
  const tab = tabs.find((t) => t.id === activeTab);

  return (
    <section id="propuesta" className="py-20 md:py-32 bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-[#0A2342] mb-4">
            Una Educación Integral y de Vanguardia
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explorá nuestros programas académicos y la vibrante vida estudiantil que nos distingue.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center border-b mb-12">
          {tabs.map(({ id, title }) => (
            <button
              key={id}
              className={`px-6 py-3 text-lg font-medium ${
                activeTab === id ? "text-accent border-b-2 border-accent" : "text-gray-500"
              } transition`}
              onClick={() => setActiveTab(id)}
            >
              {title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {tab.id === "vida" ? (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold text-[#0A2342] mb-4">{tab.heading}</h3>
              <p className="text-gray-700 max-w-2xl mx-auto mb-10">{tab.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {tab.items.map(({ icon, title }, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-lg shadow-md text-center hover:scale-105 transition"
                  >
                    <span className="text-4xl">{icon}</span>
                    <h4 className="font-bold mt-2">{title}</h4>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.img
                src={tab.img}
                alt={tab.title}
                className="rounded-lg shadow-xl w-full object-cover max-h-[400px]"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              />
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl font-bold text-[#0A2342] mb-4">{tab.heading}</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">{tab.description}</p>
                <ul className="space-y-2 text-gray-700">
                  {tab.features.map((f, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-accent mr-3 mt-1">▶</span> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
