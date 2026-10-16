import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

const images = [
  "/img/colegiosalon.png",
  "/img/colegio2.jpg",
  "/img/colegio3.jpg",
  "/img/colegio4.jpg",
];

const Fotos = () => {
  const [sliderRef] = useKeenSlider({
    loop: true,
    mode: "snap",
    slides: {
      origin: "center",
      perView: 1,
      spacing: 15,
    },
  });

  return (
    <section className="scroll-mt-20 bg-primary px-4 py-14 text-accent sm:px-6 sm:py-20 md:px-20">
      <MotionDiv
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mx-auto max-w-5xl"
      >
        <h2 className="mb-8 text-center text-3xl font-bold sm:mb-12">Galería de Fotos</h2>
        <div
          ref={sliderRef}
          className="keen-slider overflow-hidden rounded-xl shadow-lg"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Galería de fotos del colegio"
        >
          {images.map((img, i) => (
            <div
              className="keen-slider__slide"
              key={img}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`Imagen ${i + 1} de ${images.length}`}
            >
              <img
                src={img}
                alt={`Foto colegio ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-64 w-full object-cover sm:h-80 md:h-96"
              />
            </div>
          ))}
        </div>
      </MotionDiv>
    </section>
  );
};

export default Fotos;
