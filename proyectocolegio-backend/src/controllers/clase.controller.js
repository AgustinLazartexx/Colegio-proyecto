import Clase from "../models/Clases.js";
import Materia from "../models/materia.model.js";
import mongoose from "mongoose";

const handleNotFoundError = (res, type) => res.status(404).json({ msg: `${type} no encontrada` });
const handleInvalidIdError = (res, type, id) => res.status(400).json({ msg: `ID de ${type} inválido: ${id}` });

// Crear clase (solo admin)
export const crearClase = async (req, res) => {
  try {
    const { materia, profesores, diaSemana, horaInicio, horaFin } = req.body;

    if (!materia || !profesores || !Array.isArray(profesores) || profesores.length === 0 || !diaSemana || !horaInicio || !horaFin) {
       return res.status(400).json({ msg: "Faltan campos requeridos (materia, profesores, diaSemana, horaInicio, horaFin)" });
    }

    if (!mongoose.Types.ObjectId.isValid(materia)) {
        return handleInvalidIdError(res, "materia", materia);
    }
    for (const profId of profesores) {
      if (!mongoose.Types.ObjectId.isValid(profId)) {
        return handleInvalidIdError(res, "profesor", profId);
      }
    }

    const materiaExiste = await Materia.findById(materia);
    if (!materiaExiste) { 
        return handleNotFoundError(res, "Materia"); 
    }
    
    const anioClase = materiaExiste.anio;
    const divisionClase = materiaExiste.division;
    
    // --- CORRECCIÓN DE VALIDACIÓN ---
    if (anioClase == null || divisionClase == null) { 
         return res.status(400).json({ msg: "La materia seleccionada no tiene el año o división definidos." });
    }

    const conflicto = await Clase.verificarConflictoHorario(
      profesores, 
      diaSemana,
      horaInicio,
      horaFin
 	 );

 	 if (conflicto) {
      const nombresProfesoresConflicto = (conflicto.profesores || []).map(p => p.nombre).join(', ');
      return res.status(400).json({
     	 msg: `Conflicto de horario. ${nombresProfesoresConflicto} ya tiene una clase en ese horario.`,
     	 claseExistente: conflicto 
      });
    }

 	 const claseData = {
 	   materia,
 	   profesores, 
 	   anio: anioClase, 
 	   division: divisionClase, 
 	   diaSemana,
 	   horaInicio,
 	   horaFin
 	 };

 	 const clase = new Clase(claseData);
 	 await clase.save(); // <-- Aquí es donde fallaba

 	 await clase.populate([
 	 	 { path: "materia", select: "nombre codigo anio division" },
 	 	 { path: "profesores", select: "nombre apellido email" }
 	 ]);

 	 res.status(201).json({
 	 	 msg: "Clase creada correctamente",
 	 	 clase: clase.obtenerInfoCompleta()
 	 });

  } catch (error) {
     console.error("=== ERROR AL CREAR CLASE ===", error);
     if (error.code === 11000) {
        return res.status(400).json({ msg: "Error: Ya existe una clase con esos mismos datos (materia, día y hora)." });
     }
     if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: `Error de validación: ${error.message}` });
     }
     res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};

// Obtener todas las clases (admin)
export const obtenerTodasLasClases = async (req, res) => {
  try {
    const { anio, materia, profesor, division, diaSemana } = req.query;
    let filtros = {};

    if (anio) filtros.anio = parseInt(anio);
    if (materia) filtros.materia = materia;
    if (profesor) filtros.profesores = profesor; 
    if (division) filtros.division = division.toUpperCase(); 
 	 if (diaSemana) filtros.diaSemana = diaSemana;

 	 const clases = await Clase.find(filtros)
      .populate("materia", "nombre codigo anio division")
      .populate("profesores", "nombre apellido email")
      .sort({ anio: 1, division: 1, diaSemana: 1, horaInicio: 1 });

 	 res.json({
 	   msg: "Clases obtenidas correctamente",
 	   clases: clases.map(clase => clase.obtenerInfoCompleta()),
 	   total: clases.length,
 	   filtros: filtros
 	 });

  } catch (error) {
    console.error("=== ERROR AL OBTENER CLASES ===", error);
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
	}
};

// Obtener clases por profesor
export const obtenerClasesProfesor = async (req, res) => {
  try {
    const profesorId = req.user.id;
    
    const clases = await Clase.find({ profesores: profesorId }) 
      .populate("materia", "nombre codigo anio division")
      .populate("profesores", "nombre apellido email")
      .sort({ diaSemana: 1, horaInicio: 1 });
      
    res.json({
      msg: "Clases obtenidas correctamente",
      clases: clases.map(clase => clase.obtenerInfoCompleta()),
      total: clases.length,
 	   profesor: { id: profesorId, nombre: req.user.nombre }
    });
      
  } catch (error) { 
    console.error("=== ERROR AL OBTENER CLASES PROFESOR ===", error);
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
	}
};

// Actualizar clase (solo admin) - VERSIÓN LIMITADA
export const actualizarClase = async (req, res) => {
  try {
    const { id } = req.params;
    const { diaSemana, horaInicio, horaFin, profesores } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleInvalidIdError(res, "clase", id);
    }

    const updatePayload = {};

    if (diaSemana) updatePayload.diaSemana = diaSemana;
    if (horaInicio) updatePayload.horaInicio = horaInicio;
    if (horaFin) updatePayload.horaFin = horaFin;
    if (profesores && Array.isArray(profesores)) {
      for (const profId of profesores) {
        if (!mongoose.Types.ObjectId.isValid(profId)) {
          return handleInvalidIdError(res, "profesor", profId);
        }
      }
      updatePayload.profesores = profesores;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos válidos para actualizar.",
      });
    }

    const claseExistente = await Clase.findById(id);
    if (!claseExistente) {
      return handleNotFoundError(res, "Clase");
    }

    const profesoresIds = updatePayload.profesores || claseExistente.profesores;
    const diaSemanaCheck = updatePayload.diaSemana || claseExistente.diaSemana;
    const horaInicioCheck = updatePayload.horaInicio || claseExistente.horaInicio;
    const horaFinCheck = updatePayload.horaFin || claseExistente.horaFin;

    if (updatePayload.horaInicio || updatePayload.horaFin) {
        updatePayload.horaInicio = horaInicioCheck;
        updatePayload.horaFin = horaFinCheck;
    }

    const conflicto = await Clase.verificarConflictoHorario(
      profesoresIds,
      diaSemanaCheck,
      horaInicioCheck,
      horaFinCheck,
      id // Excluir la clase actual
    );

    if (conflicto) {
      const nombresProfesoresConflicto = (conflicto.profesores || [])
        .map((p) => p.nombre)
        .join(", ");
      return res.status(400).json({
        msg: `Conflicto de horario: ${nombresProfesoresConflicto} ya tiene clase.`,
      });
    }

    const claseActualizada = await Clase.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true, 
    }).populate([
      { path: "materia", select: "nombre codigo anio division" },
      { path: "profesores", select: "nombre apellido email" },
    ]);

    res.json({
      msg: "Clase actualizada correctamente",
      clase: claseActualizada.obtenerInfoCompleta(),
    });
  } catch (error) {
    console.error("=== ERROR AL ACTUALIZAR CLASE ===", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ msg: "Error de validación: " + error.message });
    }
    res
      .status(500)
      .json({ msg: "Error interno del servidor", error: error.message });
  }
};

// Implementar eliminarClase
export const eliminarClase = async (req, res) => { 
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return handleInvalidIdError(res, "clase", id);
        }
        
        const result = await Clase.findByIdAndDelete(id); 

        if (!result) {
            return handleNotFoundError(res, "Clase");
        }

        res.json({ msg: "Clase eliminada con éxito" });

    } catch (error) {
        console.error("Error al eliminar clase:", error);
        res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
};

// Obtener clase por ID
export const obtenerClasePorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) { return handleInvalidIdError(res, "clase", id); }

    const clase = await Clase.findById(id)
 	 .populate("materia", "nombre codigo descripcion anio division")
 	 .populate("profesores", "nombre apellido email telefono");

 	 if (!clase) { return handleNotFoundError(res, "Clase"); }

 	 res.json({
 	   msg: "Clase encontrada",
 	   clase: clase.obtenerInfoCompleta()
 	 });

  } catch (error) {
       console.error("=== ERROR AL OBTENER CLASE POR ID ===", error);
       res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};