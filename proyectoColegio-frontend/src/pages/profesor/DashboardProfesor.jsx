import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import MateriaCard from "./MateriaCard"; // podemos crear este

const DashboardProfesor = () => {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const res = await axios.get(`/api/materias/profesor/${user._id}`);
        setMaterias(res.data);
      } catch (error) {
        console.error("Error cargando materias del profesor", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterias();
  }, [user]);

  if (loading) return <p>Cargando tus materias...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Materias Asignadas</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materias.map((materia) => (
          <MateriaCard key={materia._id} materia={materia} />
        ))}
      </div>
    </div>
  );
};

export default DashboardProfesor;
