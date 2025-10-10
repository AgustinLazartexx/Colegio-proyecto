import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaCalendarAlt, FaStar, FaInfoCircle } from "react-icons/fa";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CalendarioAlumno = () => {
  const [value, setValue] = useState(new Date());

  const eventos = [
    {
      date: "2025-06-25",
      title: "Examen de Matemática",
      description: "Capítulo 5: Funciones y ecuaciones.",
    },
    {
      date: "2025-06-27",
      title: "Entrega de Tarea de Historia",
      description: "Ensayo sobre la Segunda Guerra Mundial.",
    },
    {
      date: "2025-07-01",
      title: "Prueba de Inglés",
      description: "Gramática y vocabulario de la unidad 3.",
    },
    {
      date: "2025-07-15",
      title: "Reunión de Padres y Maestros",
      description: "A las 18:00 en el salón de actos.",
    },
  ];

  const handleDateChange = (date) => {
    setValue(date);
  };

  const selectedDayEvents = eventos.filter(
    (evento) => evento.date === format(value, "yyyy-MM-dd")
  );

  const renderTileContent = ({ date, view }) => {
    if (view === "month") {
      const dateStr = format(date, "yyyy-MM-dd");
      if (eventos.some((e) => e.date === dateStr)) {
        return (
          <div className="flex justify-center items-center mt-1">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden md:flex">
        {/* Calendario */}
        <div className="p-6 md:w-1/2">
          <div className="flex items-center gap-3 text-gray-800 mb-6">
            <FaCalendarAlt className="text-2xl text-blue-600" />
            <h2 className="text-xl font-bold">Calendario Académico</h2>
          </div>
          <Calendar
            onChange={handleDateChange}
            value={value}
            locale="es"
            tileContent={renderTileContent}
            className="w-full !border-none !font-sans"
          />
        </div>

        {/* Detalles del día */}
        <div className="p-6 md:w-1/2 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200">
          <div className="flex items-center gap-3 text-gray-800 mb-6">
            <FaStar className="text-2xl text-yellow-500" />
            <h3 className="text-xl font-bold">
              Eventos del Día:
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {format(value, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          {selectedDayEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedDayEvents.map((evento, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-xl shadow-sm border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900">{evento.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {evento.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <FaInfoCircle className="text-gray-400 text-4xl mb-3" />
              <p className="text-gray-600 font-medium">
                No hay eventos programados para esta fecha.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarioAlumno;