import Clase from "../models/Clases.js";
import Materia from "../models/materia.model.js";
import Usuario from "../models/User.js"; // Asegúrate que la ruta sea correcta
import mongoose from "mongoose";

// --- Helpers para manejar errores ---
const handleNotFoundError = (res, type) => res.status(404).json({ msg: `${type} no encontrada` });
const handleInvalidIdError = (res, type, id) => res.status(400).json({ msg: `ID de ${type} inválido: ${id}` });


// Crear clase (solo admin)
export const crearClase = async (req, res) => {
  try {
    const { materia, profesores, diaSemana, horaInicio, horaFin } = req.body;

    // Validar campos requeridos
    if (!materia || !profesores || !Array.isArray(profesores) || profesores.length === 0 || !diaSemana || !horaInicio || !horaFin) {
       return res.status(400).json({ msg: "Faltan campos requeridos (materia, profesores, diaSemana, horaInicio, horaFin) o el formato de profesores es incorrecto" });
    }

    // Validar ObjectIds (materia)
    if (!mongoose.Types.ObjectId.isValid(materia)) {
        return handleInvalidIdError(res, "materia", materia);
    }
    for (const profId of profesores) {
      if (!mongoose.Types.ObjectId.isValid(profId)) {
        return handleInvalidIdError(res, "profesor", profId);
      }
    }

    // Verificar existencia de materia y obtener anio/division (Fuente de la verdad)
    const materiaExiste = await Materia.findById(materia);
    if (!materiaExiste) { 
        return handleNotFoundError(res, "Materia"); 
    }
    
    // FORZAMOS A USAR AÑO Y DIVISIÓN DE LA MATERIA
    const anioClase = materiaExiste.anio;
    const divisionClase = materiaExiste.division;
    
    if (!anioClase || !divisionClase) {
         return res.status(400).json({ msg: "La materia seleccionada no tiene el año o división definidos en la base de datos." });
    }

    // (Asumo que aquí va tu lógica de verificar rol de profesor...)

    // Verificar conflictos (Asumo que tienes el método estático 'verificarConflictoHorario')
    const conflicto = await Clase.verificarConflictoHorario(
      profesores, 
      diaSemana,
      horaInicio,
      horaFin
  	 );

  	 if (conflicto) {
      const nombresProfesoresConflicto = (conflicto.profesores || []).map(p => p.nombre).join(', ');
      return res.status(400).json({
      	 msg: `Conflicto de horario encontrado. Al menos uno de los profesores (${nombresProfesoresConflicto}) ya tiene una clase en ese horario.`,
      	 claseExistente: conflicto 
      });
    }

    // Crear la clase con los datos forzados de la materia
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
  	 await clase.save();

  	 // Popular datos para la respuesta
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

// Actualizar clase (solo admin)
export const actualizarClase = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;
    const { materia } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) { 
        return handleInvalidIdError(res, "clase", id); 
    }

    const claseExistente = await Clase.findById(id).populate("materia", "anio division");
    if (!claseExistente) { 
        return handleNotFoundError(res, "Clase"); 
    }

    let anioClase = claseExistente.materia?.anio;
    let divisionClase = claseExistente.materia?.division;
    let materiaIdToUse = claseExistente.materia._id;

    if (materia && materia.toString() !== claseExistente.materia._id.toString()) {
        if (!mongoose.Types.ObjectId.isValid(materia)) {
            return handleInvalidIdError(res, "materia", materia);
        }
        const nuevaMateria = await Materia.findById(materia);
        if (!nuevaMateria) {
            return handleNotFoundError(res, "Materia");
        }
        
        anioClase = nuevaMateria.anio;
        divisionClase = nuevaMateria.division;
        materiaIdToUse = nuevaMateria._id;
    }
    
    const updatePayload = {
        ...datosActualizacion,
        materia: materiaIdToUse,
        anio: anioClase, 
        division: divisionClase 
    };

    // Verificar conflictos
    const profesoresIds = updatePayload.profesores || claseExistente.profesores;
    const diaSemana = updatePayload.diaSemana || claseExistente.diaSemana;
    const horaInicio = updatePayload.horaInicio || claseExistente.horaInicio;
    const horaFin = updatePayload.horaFin || claseExistente.horaFin;

  	 if (updatePayload.profesores || updatePayload.diaSemana || 
  	 	 	 updatePayload.horaInicio || updatePayload.horaFin || updatePayload.materia) 
  	 {
  	 	 const conflicto = await Clase.verificarConflictoHorario(
  	 	 	 profesoresIds, 
  	 	 	 diaSemana,
  	 	 	 horaInicio,
  	 	 	 horaFin,
  	 	 	 id // Excluir la clase actual
  	 	 );

  	 	 if (conflicto) {
  	 	 	  const nombresProfesoresConflicto = (conflicto.profesores || []).map(p => p.nombre).join(', ');
  	 	 	    return res.status(400).json({ msg: `Conflicto de horario encontrado. Al menos uno de los profesores (${nombresProfesoresConflicto}) ya tiene una clase en ese horario.` });
  	 	 }
  	 }

  	 const claseActualizada = await Clase.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
  	 	 .populate([
  	 	 	 { path: "materia", select: "nombre codigo anio division" },
  	 	 	 { path: "profesores", select: "nombre apellido email" }
  	 	 ]);

  	 res.json({
  	 	 msg: "Clase actualizada correctamente",
  	 	 clase: claseActualizada.obtenerInfoCompleta()
  	 });

  } catch (error) {
       console.error("=== ERROR AL ACTUALIZAR CLASE ===", error);
       if (error.name === 'ValidationError') {
           return res.status(400).json({ msg: 'Error de validación: ' + error.message });
       }
       res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};

// --- CORRECCIÓN CRÍTICA: Implementar eliminarClase ---
export const eliminarClase = async (req, res) => { 
    try {
        const { id } = req.params;
        
        // 1. Validar que el ID sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return handleInvalidIdError(res, "clase", id);
        }
        
        // 2. Buscar y eliminar el documento
        const result = await Clase.findByIdAndDelete(id); 

        // 3. Si no se encontró, devolver 404
        if (!result) {
            return handleNotFoundError(res, "Clase");
        }

        // 4. Si se eliminó, devolver éxito
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