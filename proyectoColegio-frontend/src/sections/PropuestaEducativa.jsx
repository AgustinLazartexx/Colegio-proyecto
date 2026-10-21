import { useState } from "react";
import { motion } from "framer-motion";

const MotionDiv = motion.div;
const MotionImg = motion.img;

const tabs = [
  {
    id: "primaria",
    title: "Primaria",
    img: "/img/vida-escolar-1.png",
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
    img: "/img/vida-escolar-2.png",
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
    <section id="propuesta" className="scroll-mt-20 bg-[#F8F7F4] px-4 py-14 sm:px-6 sm:py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <MotionDiv
          className="mb-10 text-center sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-4 text-3xl font-bold leading-tight text-[#0A2342] sm:text-4xl">
            Una Educación Integral y de Vanguardia
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-700 sm:text-lg">
            Explorá nuestros programas académicos y la vibrante vida estudiantil que nos distingue.
          </p>
        </MotionDiv>

        {/* Tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2 border-b border-slate-200 pb-3 sm:mb-12" role="group" aria-label="Elegir propuesta educativa">
          {tabs.map(({ id, title }) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeTab === id}
              aria-controls="propuesta-content"
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:px-6 sm:text-base ${
                activeTab === id ? "bg-[#193CB8] text-white" : "bg-white text-gray-700 hover:bg-blue-50"
              }`}
              onClick={() => setActiveTab(id)}
            >
              {title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div id="propuesta-content" aria-live="polite">
          {tab.id === "vida" ? (
            <MotionDiv
              className="text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-4 text-2xl font-bold text-[#0A2342] sm:text-3xl">{tab.heading}</h3>
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
            </MotionDiv>
          ) : (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <MotionImg
                src={tab.img}
                alt={tab.title}
                className="rounded-lg shadow-xl w-full object-cover max-h-[400px]"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              />
              <MotionDiv
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="mb-4 text-2xl font-bold text-[#0A2342] sm:text-3xl">{tab.heading}</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">{tab.description}</p>
                <ul className="space-y-2 text-gray-700">
                  {tab.features.map((f, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-accent mr-3 mt-1">▶</span> {f}
                    </li>
                  ))}
                </ul>
              </MotionDiv>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
