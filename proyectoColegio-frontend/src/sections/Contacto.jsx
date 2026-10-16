import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

const MotionDiv = motion.div;
const MotionForm = motion.form;
const location = {
  lat: -27.3621,
  lng: -65.2063,
  address: "San Martín 332 Este El Manantial (ruta 38-km. 1539), Tucumán",
};

const Contacto = () => {
  const [mapOption, setMapOption] = useState('leaflet'); // 'leaflet', 'mapbox', 'iframe'
  const [whatsappLink, setWhatsappLink] = useState("");
  const mapRef = useRef(null);

  // Opción 1: OpenStreetMap con Leaflet (100% gratuito)
  const createLeafletMap = useCallback(() => {
    if (!mapRef.current || !window.L) return;

    if (window.currentMap) {
      window.currentMap.remove();
    }

    const map = window.L.map(mapRef.current).setView([location.lat, location.lng], 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const customIcon = window.L.divIcon({
      html: `
        <div style="
          background-color: #dc2626;
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          transform: rotate(-45deg);
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        ">
          <div style="
            color: white;
            font-size: 16px;
            font-weight: bold;
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            margin-top: -3px;
          ">🏫</div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    const marker = window.L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">🏫 Colegio María Reina</h3>
        <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">
          <strong>📍 Dirección:</strong><br>
          San Martín 332 Este El Manantial<br>
          (ruta 38-km. 1539), Tucumán<br><br>
          <strong>📞 Tel:</strong> +54 9 3814557943<br>
          <strong>✉️ Email:</strong> contacto@colegiomariareina.edu.ar
        </p>
      </div>
    `);
    window.currentMap = map;
  }, [mapRef]);

  const initLeafletMap = useCallback(() => {
    if (typeof window.L === 'undefined') {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = createLeafletMap;
      document.head.appendChild(script);
    } else {
      createLeafletMap();
    }
  }, [createLeafletMap]);

  useEffect(() => {
    if (mapOption === 'leaflet') {
      initLeafletMap();
    }

    return () => {
      if (window.currentMap) {
        window.currentMap.remove();
        window.currentMap = null;
      }
    };
  }, [initLeafletMap, mapOption]);

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
    ].filter(Boolean).join("\n");
    const url = `https://wa.me/5493814557943?text=${encodeURIComponent(message)}`;
    setWhatsappLink(url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const MapSelector = () => (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <p className="mb-2 text-sm font-semibold text-gray-700" id="map-options-label">
        Elegí cómo ver el mapa:
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="map-options-label">
        <button
          type="button"
          onClick={() => setMapOption('leaflet')}
          aria-pressed={mapOption === 'leaflet'}
          className={`min-h-10 rounded-full px-3 py-2 text-xs transition-colors ${
            mapOption === 'leaflet'
              ? 'bg-red-700 text-white'
              : 'bg-white text-gray-700 hover:bg-red-50'
          } focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200`}
        >
          🗺️ OpenStreetMap (Recomendado)
        </button>
        <button
          type="button"
          onClick={() => setMapOption('iframe')}
          aria-pressed={mapOption === 'iframe'}
          className={`min-h-10 rounded-full px-3 py-2 text-xs transition-colors ${
            mapOption === 'iframe'
              ? 'bg-red-700 text-white'
              : 'bg-white text-gray-700 hover:bg-red-50'
          } focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200`}
        >
          🌐 Google Maps Embed
        </button>
        <button
          type="button"
          onClick={() => setMapOption('static')}
          aria-pressed={mapOption === 'static'}
          className={`min-h-10 rounded-full px-3 py-2 text-xs transition-colors ${
            mapOption === 'static'
              ? 'bg-red-700 text-white'
              : 'bg-white text-gray-700 hover:bg-red-50'
          } focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200`}
        >
          🖼️ Imagen estática
        </button>
      </div>
    </div>
  );

  const renderMap = () => {
    switch (mapOption) {
      case 'leaflet':
        return (
          <div 
            ref={mapRef}
            className="w-full h-80 rounded-lg border"
            style={{ minHeight: '320px' }}
          >
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Cargando mapa interactivo...</p>
              </div>
            </div>
          </div>
        );

      case 'iframe':
        return (
          <iframe
            title="Ubicación Colegio María Reina"
            className="w-full h-80 rounded-lg border"
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.5!2d${location.lng}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDIxJzQzLjYiUyA2NcKwMTInMjIuNyJX!5e0!3m2!1ses!2sar!4v1234567890!5m2!1ses!2sar`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        );

      case 'static':
        return (
          <div className="relative">
            <img
              src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-school+dc2626(${location.lng},${location.lat})/${location.lng},${location.lat},15/600x320@2x?access_token=pk.eyJ1IjoidGVzdCIsImEiOiJjbGFtNzQwZzQwMGQyM3VwYWc2dzE3YzNhIn0.test`}
              alt="Mapa de ubicación del Colegio María Reina"
              className="w-full h-80 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                  <svg width="600" height="320" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f3f4f6"/>
                    <text x="50%" y="40%" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">
                      🗺️ Mapa no disponible
                    </text>
                    <text x="50%" y="55%" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">
                      Colegio María Reina
                    </text>
                    <text x="50%" y="70%" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">
                      El Manantial, Tucumán
                    </text>
                  </svg>
                `);
              }}
            />
            <div className="absolute inset-0 bg-red-600 opacity-10 rounded-lg pointer-events-none"></div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="scroll-mt-20 bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-20" id="contacto">
      <MotionDiv
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-red-700">
            Estamos para ayudarte
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Inscripciones y consultas
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-700">
            ¿Querés conocer la propuesta o consultar por una inscripción? Envianos
            tu mensaje y continuá la conversación con el colegio por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
          <MotionForm
            onSubmit={handleFormSubmit}
            aria-describedby="whatsapp-form-help whatsapp-form-status"
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>
              <label htmlFor="consulta-nombre" className="mb-2 block text-sm font-semibold text-gray-800">
                Tu nombre <span aria-hidden="true">*</span>
              </label>
              <input
                id="consulta-nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
                className="min-h-12 w-full rounded-lg border border-slate-300 p-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:border-blue-700"
              />
            </div>
            <div>
              <label htmlFor="consulta-tipo" className="mb-2 block text-sm font-semibold text-gray-800">
                ¿En qué podemos ayudarte? <span aria-hidden="true">*</span>
              </label>
              <select
                id="consulta-tipo"
                name="tipoConsulta"
                required
                defaultValue="Inscripción"
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-gray-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:border-blue-700"
              >
                <option>Inscripción</option>
                <option>Consulta general</option>
                <option>Conocer la propuesta educativa</option>
                <option>Otro tema</option>
              </select>
            </div>
            <div>
              <label htmlFor="consulta-curso" className="mb-2 block text-sm font-semibold text-gray-800">
                Curso o año de interés <span className="font-normal text-gray-600">(opcional)</span>
              </label>
              <input
                id="consulta-curso"
                name="curso"
                type="text"
                placeholder="Por ejemplo: 1° año"
                autoComplete="off"
                className="min-h-12 w-full rounded-lg border border-slate-300 p-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:border-blue-700"
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="consulta-email" className="mb-2 block text-sm font-semibold text-gray-800">
                  Correo electrónico <span className="font-normal text-gray-600">(opcional)</span>
                </label>
              <input
                id="consulta-email"
                name="email"
                type="email"
                placeholder="nombre@correo.com"
                autoComplete="email"
                className="min-h-12 w-full rounded-lg border border-slate-300 p-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:border-blue-700"
              />
              </div>
              <div>
              <label htmlFor="consulta-telefono" className="mb-2 block text-sm font-semibold text-gray-800">
                Teléfono <span className="font-normal text-gray-600">(opcional)</span>
              </label>
              <input
                id="consulta-telefono"
                name="telefono"
                type="tel"
                placeholder="+54 9..."
                autoComplete="tel"
                className="min-h-12 w-full rounded-lg border border-slate-300 p-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:border-blue-700"
              />
              </div>
            </div>
            <div>
              <label htmlFor="consulta-mensaje" className="mb-2 block text-sm font-semibold text-gray-800">
                Tu consulta <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="consulta-mensaje"
                name="mensaje"
                rows="4"
                placeholder="Contanos brevemente qué necesitás saber..."
                required
                className="w-full resize-y rounded-lg border border-slate-300 p-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:border-blue-700"
              />
            </div>
            <p id="whatsapp-form-help" className="text-sm leading-6 text-gray-700">
              Se abrirá WhatsApp con el mensaje preparado. Revisalo y presioná
              enviar para compartirlo con el colegio.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-base font-bold text-white shadow-md transition hover:bg-green-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
            >
              <MessageCircle size={20} aria-hidden="true" />
              Continuar por WhatsApp
            </button>
            <p id="whatsapp-form-status" aria-live="polite" role="status" className="text-sm text-gray-700">
              {whatsappLink && "Si WhatsApp no se abrió, "}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-800 underline underline-offset-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                >
                  abrilo desde este enlace
                </a>
              )}
            </p>
          </MotionForm>

          <MotionDiv
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {/* Información de contacto */}
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Información de contacto</h3>
              
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-lg bg-red-100 p-2">
                  <MapPin aria-hidden="true" className="h-6 w-6 text-red-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Dirección</h4>
                  <p className="text-sm leading-relaxed text-gray-700">
                    San Martín 332 Este El Manantial<br />
                    (ruta 38-km. 1539)<br />
                    Tucumán, Argentina
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-lg bg-red-100 p-2">
                  <Phone aria-hidden="true" className="h-6 w-6 text-red-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Teléfono</h4>
                  <a 
                    href="tel:+5493814557943" 
                    className="break-all text-sm font-medium text-red-800 underline underline-offset-2 hover:text-red-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                  >
                    +54 9 3814557943
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-lg bg-red-100 p-2">
                  <Mail aria-hidden="true" className="h-6 w-6 text-red-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Email</h4>
                  <a 
                    href="mailto:contacto@colegiomariareina.edu.ar" 
                    className="break-all text-sm font-medium text-red-800 underline underline-offset-2 hover:text-red-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                  >
                    contacto@colegiomariareina.edu.ar
                  </a>
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Nuestra ubicación</h3>
              
              <MapSelector />
              
              {renderMap()}
              
              <div className="mt-4 flex flex-col sm:flex-row gap-2 text-center">
                <a
                  href="https://maps.app.goo.gl/gxvu3QGcmpRqSG2o8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <MapPin className="w-4 h-4" />
                  Abrir en Google Maps
                </a>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}&zoom=15#map=15/${location.lat}/${location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  🗺️ Abrir en OpenStreetMap
                </a>
              </div>

              <div className="mt-3 text-center">
                <a
                  href={`https://www.waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors text-sm font-medium"
                >
                  🚗 Navegar con Waze
                </a>
              </div>
            </div>
          </MotionDiv>
        </div>
      </MotionDiv>
    </section>
  );
};

export default Contacto;