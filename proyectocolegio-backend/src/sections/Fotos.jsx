import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { motion } from "framer-motion";

const images = [
  "/img/colegiosalon.png",
  "/img/colegio2.jpg",
  "/img/colegio3.jpg",
  "/img/colegio4.jpg",
  "/img/colegio5.jpg",
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
    <section className="bg-primary py-20 px-6 md:px-20 text-accent">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-center mb-12">Galería de Fotos</h2>
        <div ref={sliderRef} className="keen-slider rounded-xl overflow-hidden shadow-lg">
          {images.map((img, i) => (
            <div className="keen-slider__slide" key={i}>
              <img
                src={img}
                alt={`Foto colegio ${i + 1}`}
                className="w-full h-72 md:h-96 object-cover"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Fotos;
