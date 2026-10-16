
import Hero from "../sections/Hero";
import QuienesSomos from "../sections/QuienesSomos";
import PropuestaEducativa from "../sections/PropuestaEducativa";
import Valores from "../sections/Valores";
import Fotos from "../sections/Fotos";
import Comunidad from "../sections/Comunidad";
import TipoEducacion from "../sections/TipoEducacion";
import Contacto from "../sections/Contacto";
import Footer from "../components/Footer";
import { MotionConfig } from "framer-motion";

const Home = () => {
  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-primary text-accent">
        <main id="contenido">
          <Hero />
          <QuienesSomos />
          <PropuestaEducativa />
          <Valores />
          <Fotos />
          <Comunidad />
          <TipoEducacion />
          <Contacto />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
};

export default Home;
