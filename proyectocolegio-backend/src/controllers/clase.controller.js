// controllers/clase.controller.js
import Clase from "../models/Clases.js";
import Materia from "../models/materia.model.js";
import Usuario from "../models/User.js"; // Asegúrate que la ruta sea correcta
import mongoose from "mongoose";

// Crear clase (solo admin)
export const crearClase = async (req, res) => {
  try {
    console.log("=== CREAR CLASE ===");
    console.log("Datos recibidos:", req.body);
    
    // --- CAMBIO: Destructurar 'profesores' (array) y 'division' ---
    const { materia, profesores, anio, division, diaSemana, horaInicio, horaFin } = req.body;

    // Validar campos requeridos
    if (!materia || !profesores || !Array.isArray(profesores) || profesores.length === 0 || !anio || !division || !diaSemana || !horaInicio || !horaFin) {
       return res.status(400).json({ msg: "Faltan campos requeridos o el formato de profesores es incorrecto (debe ser un array no vacío)" });
    }
    // --- FIN CAMBIO ---

    // Validar ObjectIds (materia y cada profesor)
    if (!mongoose.Types.ObjectId.isValid(materia)) { /* ... */ }
    for (const profId of profesores) {
      if (!mongoose.Types.ObjectId.isValid(profId)) {
        return res.status(400).json({ msg: `ID de profesor inválido: ${profId}` });
      }
    }

    // Verificar existencia de materia
    const materiaExiste = await Materia.findById(materia);
    if (!materiaExiste) { /* ... */ }

    // Verificar existencia y rol de CADA profesor
    for (const profId of profesores) {
      const profesorExiste = await Usuario.findById(profId);
      if (!profesorExiste) {
        return res.status(404).json({ msg: `Profesor con ID ${profId} no encontrado` });
      }
      if (profesorExiste.rol !== "profesor") {
        return res.status(400).json({ msg: `El usuario ${profesorExiste.nombre} no es un profesor` });
      }
    }

    // --- CAMBIO: Verificar conflictos para el array de profesores ---
    const conflicto = await Clase.verificarConflictoHorario(
      profesores, // Pasamos el array
      diaSemana,
      horaInicio,
      horaFin
    );

    if (conflicto) {
      // El conflicto ahora puede venir de cualquiera de los profesores
      const nombresProfesoresConflicto = conflicto.profesores.map(p => p.nombre).join(', ');
      return res.status(400).json({
        msg: `Conflicto de horario encontrado. Al menos uno de los profesores (${nombresProfesoresConflicto}) ya tiene una clase en ese horario.`,
        claseExistente: conflicto // Ya viene populado del método estático
      });
    }
    // --- FIN CAMBIO ---

    // Crear la clase
    const claseData = {
      materia,
      profesores, // Guardamos el array
      anio: parseInt(anio),
      division, // Guardamos la división
      diaSemana,
      horaInicio,
      horaFin
    };

    const clase = new Clase(claseData);
    await clase.save();
    console.log("Clase creada exitosamente:", clase._id);

    // Popular datos para la respuesta
    await clase.populate([
      { path: "materia", select: "nombre codigo" },
      { path: "profesores", select: "nombre email" } // Populate del array
    ]);

    res.status(201).json({
      msg: "Clase creada correctamente",
      clase: clase.obtenerInfoCompleta() // El método ya fue actualizado
    });

  } catch (error) {
     // ... (Manejo de errores sin cambios, excepto quizás mensajes más específicos) ...
     console.error("=== ERROR AL CREAR CLASE ===", error);
     res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};

// Obtener todas las clases (admin)
export const obtenerTodasLasClases = async (req, res) => {
  try {
     // --- CAMBIO: Añadir filtro por 'division' ---
    const { anio, materia, profesor /*podría ser ID de un profesor*/, division, diaSemana } = req.query;
    let filtros = {};

    if (anio) filtros.anio = parseInt(anio);
    if (materia) filtros.materia = materia;
    // Si se filtra por profesor, buscar clases donde ese profesor esté en el array
    if (profesor) filtros.profesores = profesor; 
    if (division) filtros.division = division.toUpperCase(); // <-- NUEVO FILTRO
    if (diaSemana) filtros.diaSemana = diaSemana;
    // --- FIN CAMBIO ---

    const clases = await Clase.find(filtros)
      .populate("materia", "nombre codigo")
      .populate("profesores", "nombre email") // Populate del array
      .sort({ anio: 1, division: 1, diaSemana: 1, horaInicio: 1 }); // Ordenar por año y división

    res.json({
      msg: "Clases obtenidas correctamente",
      clases: clases.map(clase => clase.obtenerInfoCompleta()),
      total: clases.length,
      filtros: filtros
    });

  } catch (error) { /* ... (manejo de error sin cambios) ... */ }
};

// Obtener clases por profesor (AHORA SE LLAMA /misclases EN LAS RUTAS)
export const obtenerClasesProfesor = async (req, res) => {
  try {
    const profesorId = req.user.id;
    
    // --- CAMBIO: Buscar donde el profesorId esté en el array 'profesores' ---
    const clases = await Clase.find({ profesores: profesorId }) 
      .populate("materia", "nombre codigo")
      .populate("profesores", "nombre email") // Populate del array
      .sort({ diaSemana: 1, horaInicio: 1 });
    // --- FIN CAMBIO ---
      
    res.json({
      msg: "Clases obtenidas correctamente",
      clases: clases.map(clase => clase.obtenerInfoCompleta()),
      total: clases.length,
      profesor: { id: profesorId, nombre: req.user.nombre }
    });
      
  } catch (error) { /* ... (manejo de error sin cambios) ... */ }
};

// Actualizar clase (solo admin)
export const actualizarClase = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body; // Puede incluir 'profesores' (array) y 'division'

    if (!mongoose.Types.ObjectId.isValid(id)) { /* ... */ }

    const claseExistente = await Clase.findById(id);
    if (!claseExistente) { /* ... */ }

    // --- CAMBIO: Lógica de conflicto actualizada ---
    // Verificar si se cambió algo que afecte el horario
    if (datosActualizacion.profesores || datosActualizacion.diaSemana || 
        datosActualizacion.horaInicio || datosActualizacion.horaFin) 
    {
      const profesoresIds = datosActualizacion.profesores || claseExistente.profesores;
      const diaSemana = datosActualizacion.diaSemana || claseExistente.diaSemana;
      const horaInicio = datosActualizacion.horaInicio || claseExistente.horaInicio;
      const horaFin = datosActualizacion.horaFin || claseExistente.horaFin;

      const conflicto = await Clase.verificarConflictoHorario(
        profesoresIds, // Pasamos el array
        diaSemana,
        horaInicio,
        horaFin,
        id // Excluir la clase actual
      );

      if (conflicto) {
         // ... (mensaje de error mencionando conflicto, como en crearClase) ...
         return res.status(400).json({ msg: "Conflicto de horario con otra clase" });
      }
    }
    // --- FIN CAMBIO ---

    // Actualizar la clase (Mongoose maneja la actualización del array)
    const claseActualizada = await Clase.findByIdAndUpdate(id, datosActualizacion, { new: true, runValidators: true })
      .populate([
        { path: "materia", select: "nombre codigo" },
        { path: "profesores", select: "nombre email" } // Populate del array
      ]);

    res.json({
      msg: "Clase actualizada correctamente",
      clase: claseActualizada.obtenerInfoCompleta()
    });

  } catch (error) { /* ... (manejo de error sin cambios) ... */ }
};

// Eliminar clase (solo admin) - Sin cambios necesarios en la lógica principal
export const eliminarClase = async (req, res) => { /* ... */ };

// Obtener clase por ID - Sin cambios necesarios en la lógica principal, solo populate
export const obtenerClasePorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) { /* ... */ }

    const clase = await Clase.findById(id)
      .populate("materia", "nombre codigo descripcion")
      .populate("profesores", "nombre email telefono"); // Populate del array

    if (!clase) { /* ... */ }

    res.json({
      msg: "Clase encontrada",
      clase: clase.obtenerInfoCompleta()
    });

  } catch (error) { /* ... (manejo de error sin cambios) ... */ }
};