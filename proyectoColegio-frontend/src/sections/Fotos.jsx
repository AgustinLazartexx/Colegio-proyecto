import { motion } from "framer-motion";

const MotionDiv = motion.div;

const fotos = [
  {
    src: "/img/vida-escolar-1.png",
    alt: "Estudiantes reunidos en el patio del colegio",
    caption: "La comunidad escolar",
  },
  {
    src: "/img/vida-escolar-2.png",
    alt: "Celebración escolar en el patio",
    caption: "Celebraciones y encuentros",
  },
  {
    src: "/img/vida-escolar-3.png",
    alt: "Estudiantes participando de un acto escolar",
    caption: "Actos escolares",
  },
];

const Fotos = () => {
  return (
    <section className="scroll-mt-20 bg-primary px-4 py-14 text-accent sm:px-6 sm:py-20 md:px-20">
      <MotionDiv
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mx-auto max-w-6xl"
      >
        <h2 className="mb-8 text-center text-3xl font-bold sm:mb-12">Así se vive en el colegio</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto) => (
            <figure key={foto.src} className="overflow-hidden rounded-xl bg-white shadow-lg">
              <img
                src={foto.src}
                alt={foto.alt}
                loading="lazy"
                className="h-64 w-full object-cover sm:h-72"
              />
              <figcaption className="px-5 py-3 text-center text-sm font-medium text-slate-700">
                {foto.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </MotionDiv>
    </section>
  );
};

export default Fotos;
