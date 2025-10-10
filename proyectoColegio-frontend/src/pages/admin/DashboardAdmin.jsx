import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const DashboardAdmin = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const cards = [
    {
      title: "Alumnos",
      value: stats.alumnos || 0,
      icon: UserGroupIcon,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Profesores",
      value: stats.profesores || 0,
      icon: AcademicCapIcon,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Materias",
      value: stats.materias || 0,
      icon: BookOpenIcon,
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Tareas Pendientes",
      value: stats.tareasPendientes || 0,
      icon: ClipboardDocumentCheckIcon,
      bgColor: "bg-slate-50",
      textColor: "text-slate-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600 animate-pulse">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <ChartBarSquareIcon className="h-12 w-12 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="text-lg text-gray-500 mt-1">
              Información clave de la plataforma en un solo lugar.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última actualización: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ title, value, icon: Icon, bgColor, textColor }) => (
          <div
            key={title}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center gap-4 hover:shadow-lg transition-shadow duration-300"
          >
            <div className={`flex items-center justify-center p-3 rounded-xl ${bgColor}`}>
              <Icon className={`h-8 w-8 ${textColor}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardAdmin;