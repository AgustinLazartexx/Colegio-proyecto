import { useState } from "react";
import ListaAlumnos from "./ListaAlumnos";
import CrearTareaModal from "./CrearTareaModal";

const MateriaCard = ({ materia }) => {
  const [verAlumnos, setVerAlumnos] = useState(false);
  const [abrirModalTarea, setAbrirModalTarea] = useState(false);

  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h3 className="text-xl font-semibold mb-2">{materia.nombre}</h3>
      <p className="text-sm text-gray-500">Curso: {materia.año}° año</p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
          onClick={() => setVerAlumnos(true)}
        >
          Ver Alumnos
        </button>
        <button
  className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
  onClick={() => setAbrirModalTarea(true)}
>
  Cargar Tarea
</button>

{abrirModalTarea && (
  <CrearTareaModal
    materiaId={materia._id}
    onClose={() => setAbrirModalTarea(false)}
  />
)}
        {/* Otros botones como tareas, entregas */}
      </div>

      {verAlumnos && (
        <ListaAlumnos
          materiaId={materia._id}
          onClose={() => setVerAlumnos(false)}
        />
      )}
    </div>
  );
};

export default MateriaCard;
