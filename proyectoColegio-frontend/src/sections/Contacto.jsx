import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  ExternalLink,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";

const MotionDiv = motion.div;
const MotionForm = motion.form;

const SCHOOL_LOCATION = {
  name: "Colegio Reina de la Esperanza",
  street: "San Martín 332 Este, El Manantial",
  reference: "Ruta 38, km 1539 · Tucumán, Argentina",
  fullAddress: "San Martín 332 Este, El Manantial (Ruta 38, km 1539), Tucumán, Argentina",
  mapsQuery: "Colegio Reina de la Esperanza, San Martín 332 Este, El Manantial, Tucumán, Argentina",
  googleMapsUrl: "https://maps.app.goo.gl/gxvu3QGcmpRqSG2o8",
  wazeUrl:
    "https://waze.com/ul?q=Colegio%20Reina%20de%20la%20Esperanza%20El%20Manantial%20Tucuman&navigate=yes",
  phoneDisplay: "+54 9 381 455-7943",
  phoneHref: "+5493814557943",
  email: "contacto@colegiomariareina.edu.ar",
};

const Contacto = () => {
  const [mapType, setMapType] = useState("roadmap"); // "roadmap" | "satellite"
  const [mapLoaded, setMapLoaded] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    SCHOOL_LOCATION.mapsQuery,
  )}&t=${mapType === "satellite" ? "k" : ""}&z=16&ie=UTF8&iwloc=B&output=embed`;

  const handleMapTypeChange = (nextType) => {
    if (nextType === mapType) return;
    setMapLoaded(false);
    setMapType(nextType);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(SCHOOL_LOCATION.fullAddress);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 2200);
    } catch {
      setCopiedAddress(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const values = Object.fromEntries(fields.entries());
    const message = [
      `Hola, soy ${values.nombre}.`,
      `Quiero hacer una consulta sobre: ${values.tipoConsulta}.`,
      values.curso ? `Curso/año de interés: ${values.curso}.` : "",
      values.telefono ? `Mi teléfono de contacto: ${values.telefono}.` : "",
      values.email ? `Mi correo: ${values.email}.` : "",
      `Mensaje: ${values.mensaje}`,
    ]
      .filter(Boolean)
      .join("\n");
    const url = `https://wa.me/5493814557943?text=${encodeURIComponent(message)}`;
    setWhatsappLink(url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      className="scroll-mt-20 bg-[#f7f8fc] px-4 py-16 sm:px-6 sm:py-24 lg:px-12"
      id="contacto"
    >
      <MotionDiv
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mx-auto max-w-7xl"
      >
        <div className="mb-12 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#9D0D06] shadow-sm">
            Estamos para ayudarte
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#10233f] sm:text-4xl">
            Inscripciones y consultas
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            ¿Querés conocer nuestra propuesta educativa o consultar por una inscripción?
            Escribinos por WhatsApp o visitanos en nuestra sede de El Manantial.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Formulario de consulta */}
          <MotionForm
            onSubmit={handleFormSubmit}
            aria-describedby="whatsapp-form-help whatsapp-form-status"
            className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:col-span-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-[#10233f]">Envianos tu consulta</h3>
              <p className="mt-1 text-sm text-slate-500">
                Completá los datos y abrimos el mensaje listo en WhatsApp.
              </p>
            </div>

            <div>
              <label
                htmlFor="consulta-nombre"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Tu nombre <span className="text-[#9D0D06]" aria-hidden="true">*</span>
              </label>
              <input
                id="consulta-nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-[#193CB8] focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="consulta-tipo"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Motivo <span className="text-[#9D0D06]" aria-hidden="true">*</span>
                </label>
                <select
                  id="consulta-tipo"
                  name="tipoConsulta"
                  required
                  defaultValue="Inscripción"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base text-slate-900 transition focus:border-[#193CB8] focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                  <option>Inscripción</option>
                  <option>Consulta general</option>
                  <option>Conocer la propuesta educativa</option>
                  <option>Otro tema</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="consulta-curso"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Curso de interés <span className="font-normal text-slate-500">(opcional)</span>
                </label>
                <input
                  id="consulta-curso"
                  name="curso"
                  type="text"
                  placeholder="Ej.: 1° año"
                  autoComplete="off"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-[#193CB8] focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="consulta-email"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Correo electrónico <span className="font-normal text-slate-500">(opcional)</span>
                </label>
                <input
                  id="consulta-email"
                  name="email"
                  type="email"
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-[#193CB8] focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                />
              </div>
              <div>
                <label
                  htmlFor="consulta-telefono"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Teléfono <span className="font-normal text-slate-500">(opcional)</span>
                </label>
                <input
                  id="consulta-telefono"
                  name="telefono"
                  type="tel"
                  placeholder="+54 9..."
                  autoComplete="tel"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-[#193CB8] focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="consulta-mensaje"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Tu consulta <span className="text-[#9D0D06]" aria-hidden="true">*</span>
              </label>
              <textarea
                id="consulta-mensaje"
                name="mensaje"
                rows="4"
                placeholder="Contanos brevemente qué necesitás saber..."
                required
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-[#193CB8] focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              />
            </div>

            <p id="whatsapp-form-help" className="text-xs leading-5 text-slate-500">
              Se abrirá WhatsApp con tu consulta preparada para que puedas revisarla y enviarla.
            </p>

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-md shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              <MessageCircle size={20} aria-hidden="true" />
              Continuar por WhatsApp
            </button>

            <p
              id="whatsapp-form-status"
              aria-live="polite"
              role="status"
              className="min-h-5 text-sm text-slate-600"
            >
              {whatsappLink && (
                <>
                  Si WhatsApp no se abrió automáticamente,{" "}
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#193CB8] underline underline-offset-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                  >
                    abrilo desde este enlace
                  </a>
                  .
                </>
              )}
            </p>
          </MotionForm>

          {/* Columna derecha: Mapa + Datos de contacto */}
          <MotionDiv
            className="space-y-6 lg:col-span-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Tarjeta de Ubicación y Mapa */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#193CB8]">
                    <MapPin size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#10233f]">Nuestra ubicación</h3>
                    <p className="text-xs text-slate-500">{SCHOOL_LOCATION.street}</p>
                  </div>
                </div>

                {/* Selector limpio de vista Mapa / Satélite */}
                <div
                  role="group"
                  aria-label="Tipo de vista del mapa"
                  className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold"
                >
                  <button
                    type="button"
                    onClick={() => handleMapTypeChange("roadmap")}
                    aria-pressed={mapType === "roadmap"}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      mapType === "roadmap"
                        ? "bg-[#193CB8] text-white shadow-sm"
                        : "text-slate-600 hover:text-[#10233f]"
                    }`}
                  >
                    Mapa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMapTypeChange("satellite")}
                    aria-pressed={mapType === "satellite"}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 transition ${
                      mapType === "satellite"
                        ? "bg-[#193CB8] text-white shadow-sm"
                        : "text-slate-600 hover:text-[#10233f]"
                    }`}
                  >
                    <Layers size={13} aria-hidden="true" />
                    Satélite
                  </button>
                </div>
              </div>

              {/* Contenedor del mapa interactivo */}
              <div className="relative h-72 w-full bg-slate-100 sm:h-80">
                {!mapLoaded && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500"
                    role="status"
                  >
                    <Loader2 size={26} className="animate-spin text-[#193CB8]" />
                    <span className="text-xs font-medium">Cargando mapa de ubicación...</span>
                  </div>
                )}
                <iframe
                  key={mapType}
                  title={`Mapa de ubicación - ${SCHOOL_LOCATION.name}`}
                  src={mapEmbedUrl}
                  onLoad={() => setMapLoaded(true)}
                  className={`h-full w-full border-0 transition-opacity duration-300 ${
                    mapLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Dirección + Botones de navegación */}
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-[#f7f8fc] p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#10233f]">{SCHOOL_LOCATION.street}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{SCHOOL_LOCATION.reference}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#193CB8] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    {copiedAddress ? (
                      <>
                        <Check size={14} className="text-emerald-600" aria-hidden="true" />
                        Copiada
                      </>
                    ) : (
                      <>
                        <Copy size={14} aria-hidden="true" />
                        Copiar dirección
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <a
                    href={SCHOOL_LOCATION.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#193CB8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#142f91] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    Abrir en Google Maps
                  </a>
                  <a
                    href={SCHOOL_LOCATION.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#10233f] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#193CB8] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    <Navigation size={16} aria-hidden="true" />
                    Cómo llegar con Waze
                  </a>
                </div>
              </div>
            </div>

            {/* Datos de contacto directo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href={`tel:${SCHOOL_LOCATION.phoneHref}`}
                className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-blue-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#9D0D06] transition group-hover:bg-[#9D0D06] group-hover:text-white">
                  <Phone size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Teléfono
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-[#10233f] group-hover:text-[#193CB8]">
                    {SCHOOL_LOCATION.phoneDisplay}
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${SCHOOL_LOCATION.email}`}
                className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-blue-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#193CB8] transition group-hover:bg-[#193CB8] group-hover:text-white">
                  <Mail size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Correo electrónico
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-[#10233f] group-hover:text-[#193CB8]">
                    {SCHOOL_LOCATION.email}
                  </p>
                </div>
              </a>
            </div>
          </MotionDiv>
        </div>
      </MotionDiv>
    </section>
  );
};

export default Contacto;
