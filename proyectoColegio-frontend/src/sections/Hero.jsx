import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, BookOpen, Sparkles } from "lucide-react";

const MotionDiv = motion.div;

const Hero = () => {
  return (
    <section
      id="hero"
      className="scroll-mt-20 relative isolate overflow-hidden bg-[#f7f8fc] px-4 pb-16 pt-28 text-[#10233f] sm:px-6 sm:pt-32 md:min-h-[680px] md:px-12 md:pb-24 md:pt-36"
    >
      <div className="pointer-events-none absolute -right-24 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-[-8rem] -z-10 h-[24rem] w-[24rem] rounded-full bg-red-100/60 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <MotionDiv
          className="text-center lg:text-left"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-2 text-left text-xs font-semibold text-[#193CB8] shadow-sm sm:px-4 sm:text-sm">
            <Sparkles size={16} aria-hidden="true" />
            Educación con propósito y valores
          </div>

          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[#10233f] sm:text-5xl lg:mx-0 lg:text-6xl">
            Aprender hoy.
            <span className="mt-2 block text-[#193CB8]">Construir el futuro.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
            En el Colegio Reina de la Esperanza acompañamos a cada estudiante
            con una formación integral y orientación en Contabilidad y
            Administración de Empresas.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#contacto"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#193CB8] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#142f91] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:px-6 sm:text-base"
            >
              Consultas e inscripciones
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href="#propuesta"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-[#10233f] shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:px-6 sm:text-base"
            >
              <BookOpen size={18} aria-hidden="true" />
              Nuestra propuesta
            </a>
          </div>

          <a
            href="#quienes-somos"
            className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#193CB8]"
          >
            Conocé más sobre nosotros
            <ArrowDown size={16} aria-hidden="true" />
          </a>
        </MotionDiv>

        <MotionDiv
          className="relative mx-auto w-full max-w-2xl"
          initial={{ opacity: 0, scale: 0.97, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
        >
          <div className="absolute -inset-3 -rotate-2 rounded-[2rem] bg-gradient-to-br from-blue-200 via-white to-red-100" />
          <div className="relative overflow-hidden rounded-[1.7rem] border border-white/80 bg-white p-2 shadow-2xl shadow-slate-900/15">
            <img
              src="/img/colegio1.jpg"
              alt="Estudiantes participando de una clase"
              className="h-[300px] w-full rounded-[1.25rem] object-cover object-center sm:h-[390px] lg:h-[450px]"
            />
            <div className="absolute inset-x-2 bottom-2 rounded-b-[1.25rem] bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent px-6 pb-6 pt-16 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                Colegio Reina de la Esperanza
              </p>
              <p className="mt-1 text-xl font-bold sm:text-2xl">
                Un lugar para crecer y proyectarse
              </p>
            </div>
          </div>

          <div className="absolute -left-3 top-8 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl shadow-slate-900/10 sm:-left-8 sm:top-12 sm:px-5 sm:py-4">
            <p className="text-2xl font-extrabold leading-none text-[#193CB8]">+30</p>
            <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">
              años de trayectoria
            </p>
          </div>
          <div className="absolute -bottom-5 right-4 rounded-2xl bg-[#9D0D06] px-4 py-3 text-white shadow-xl shadow-red-950/20 sm:right-8 sm:px-5 sm:py-4">
            <p className="text-xs font-medium text-red-100">Formación orientada a</p>
            <p className="mt-1 text-sm font-bold sm:text-base">
              Contabilidad y Administración
            </p>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
};

export default Hero;
