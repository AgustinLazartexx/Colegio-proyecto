import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

const Contacto = () => {
  const [mapOption, setMapOption] = useState('leaflet'); // 'leaflet', 'mapbox', 'iframe'
  const mapRef = useRef(null);

  // Coordenadas para El Manantial, Tucumán
  const location = {
    lat: -27.3621,
    lng: -65.2063,
    address: "San Martín 332 Este El Manantial (ruta 38-km. 1539), Tucumán"
  };

  // Opción 1: OpenStreetMap con Leaflet (100% gratuito)
  const initLeafletMap = () => {
    if (typeof window.L === 'undefined') {
      // Cargar Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Cargar Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        createLeafletMap();
      };
      document.head.appendChild(script);
    } else {
      createLeafletMap();
    }
  };

  const createLeafletMap = () => {
    if (!mapRef.current || !window.L) return;

    // Limpiar mapa anterior si existe
    if (window.currentMap) {
      window.currentMap.remove();
    }

    const map = window.L.map(mapRef.current).setView([location.lat, location.lng], 15);

    // Añadir tiles de OpenStreetMap (gratuito)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Crear icono personalizado
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

    // Añadir marcador
    const marker = window.L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);

    // Popup con información
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
  };

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
  }, [mapOption]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log("Formulario enviado");
  };

  const MapSelector = () => (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <label className="block text-sm font-semibold mb-2 text-gray-700">
        Opciones de mapa (elige la que prefieras):
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMapOption('leaflet')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            mapOption === 'leaflet' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-red-50'
          }`}
        >
          🗺️ OpenStreetMap (Recomendado)
        </button>
        <button
          type="button"
          onClick={() => setMapOption('iframe')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            mapOption === 'iframe' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-red-50'
          }`}
        >
          🌐 Google Maps Embed
        </button>
        <button
          type="button"
          onClick={() => setMapOption('static')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            mapOption === 'static' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-red-50'
          }`}
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
    <section className="bg-slate-50 py-20 px-6 md:px-20" id="contacto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Contacto</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulario */}
          <motion.form 
            onSubmit={handleFormSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg space-y-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre completo"
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@email.com"
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Teléfono (opcional)</label>
              <input
                type="tel"
                placeholder="+54 9 381 123 4567"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Mensaje</label>
              <textarea
                rows="5"
                placeholder="Escribe tu mensaje aquí..."
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Enviar mensaje
            </button>
          </motion.form>

          {/* Info de contacto y mapa */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {/* Información de contacto */}
            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Información de contacto</h3>
              
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <MapPin className="text-red-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Dirección</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    San Martín 332 Este El Manantial<br />
                    (ruta 38-km. 1539)<br />
                    Tucumán, Argentina
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Phone className="text-red-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Teléfono</h4>
                  <a 
                    href="tel:+5493814557943" 
                    className="text-red-600 hover:text-red-700 transition-colors text-sm"
                  >
                    +54 9 3814557943
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Mail className="text-red-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Email</h4>
                  <a 
                    href="mailto:contacto@colegiomariareina.edu.ar" 
                    className="text-red-600 hover:text-red-700 transition-colors text-sm"
                  >
                    contacto@colegiomariareina.edu.ar
                  </a>
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className="bg-white p-4 rounded-2xl shadow-lg">
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
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Contacto;