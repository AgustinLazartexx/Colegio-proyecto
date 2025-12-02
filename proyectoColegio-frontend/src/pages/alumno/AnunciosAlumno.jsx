import React, { useEffect, useState } from "react";
import SidebarAlumno from "../../components/sidebar/SidebarAlumno";
import { getAnunciosAlumno } from "../../api/api";
import { Bell, User, Calendar, BookOpen, MessageSquare } from "lucide-react";

const AnunciosAlumno = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarAnuncios = async () => {
      try {
        const res = await getAnunciosAlumno();
        setAnuncios(res.data);
      } catch (error) {
        console.error("Error cargando anuncios:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarAnuncios();
  }, []);

  // Función auxiliar para formatear fecha amigable
  const formatearFecha = (fechaIso) => {
    const fecha = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    }).format(fecha);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="text-yellow-500" /> Novedades y Observaciones
          </h1>
          <p className="text-gray-600 mt-2">Mantente al día con los avisos de tus profesores.</p>
        </header>

        {loading ? (
          <div className="text-center p-10 text-gray-500">Buscando novedades...</div>
        ) : anuncios.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500 border border-gray-200">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No hay anuncios recientes.</p>
            <p className="text-sm">Cuando tus profesores publiquen algo, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {anuncios.map((anuncio) => (
              <div 
                key={anuncio._id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Encabezado de la tarjeta */}
                <div className="bg-gray-50 p-4 flex justify-between items-start border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">
                            {anuncio.profesor?.nombre || "Profesor"}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                             <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                <BookOpen size={10} /> {anuncio.materia?.nombre || "Materia General"}
                             </span>
                             <span className="flex items-center gap-1">
                                <Calendar size={10} /> {formatearFecha(anuncio.fecha)}
                             </span>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Cuerpo del mensaje */}
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">{anuncio.titulo}</h2>
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {anuncio.mensaje}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnunciosAlumno;