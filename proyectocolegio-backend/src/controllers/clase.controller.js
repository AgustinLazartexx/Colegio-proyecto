import Clase from "../models/Clases.js";
import Materia from "../models/materia.model.js";
import Usuario from "../models/User.js";
import mongoose from "mongoose";

// Crear clase (solo admin)
export const crearClase = async (req, res) => {
  try {
    console.log("=== CREAR CLASE ===");
    console.log("Datos recibidos:", req.body);
    console.log("Usuario autenticado:", {
      id: req.user?.id,
      rol: req.user?.rol,
      nombre: req.user?.nombre
    });

    const { materia, profesor, anio, diaSemana, horaInicio, horaFin } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!materia || !profesor || !anio || !diaSemana || !horaInicio || !horaFin) {
      const camposFaltantes = {
        materia: !materia,
        profesor: !profesor,
        anio: !anio,
        diaSemana: !diaSemana,
        horaInicio: !horaInicio,
        horaFin: !horaFin
      };

      console.log("Campos faltantes:", camposFaltantes);
      
      return res.status(400).json({ 
        msg: "Todos los campos son requeridos",
        camposFaltantes
      });
    }

    // Validar que los ObjectIds sean válidos
    if (!mongoose.Types.ObjectId.isValid(materia)) {
      console.log("ID de materia inválido:", materia);
      return res.status(400).json({ msg: "ID de materia inválido" });
    }

    if (!mongoose.Types.ObjectId.isValid(profesor)) {
      console.log("ID de profesor inválido:", profesor);
      return res.status(400).json({ msg: "ID de profesor inválido" });
    }

    // Verificar que la materia existe
    const materiaExiste = await Materia.findById(materia);
    if (!materiaExiste) {
      console.log("Materia no encontrada:", materia);
      return res.status(404).json({ msg: "Materia no encontrada" });
    }
    console.log("Materia encontrada:", materiaExiste.nombre);

    // Verificar que el profesor existe y tiene rol de profesor
    const profesorExiste = await Usuario.findById(profesor);
    if (!profesorExiste) {
      console.log("Profesor no encontrado:", profesor);
      return res.status(404).json({ msg: "Profesor no encontrado" });
    }

    if (profesorExiste.rol !== "profesor") {
      console.log("Usuario no es profesor:", { 
        id: profesor, 
        rol: profesorExiste.rol 
      });
      return res.status(400).json({ 
        msg: "El usuario seleccionado no es un profesor",
        rolActual: profesorExiste.rol
      });
    }
    console.log("Profesor encontrado:", profesorExiste.nombre);

    // Verificar conflictos de horario usando el método del modelo
    const conflicto = await Clase.verificarConflictoHorario(
      profesor, 
      diaSemana, 
      horaInicio, 
      horaFin
    );

    if (conflicto) {
      console.log("Conflicto de horario encontrado:", conflicto);
      return res.status(400).json({ 
        msg: "El profesor ya tiene una clase en ese horario",
        claseExistente: {
          materia: conflicto.materia,
          diaSemana: conflicto.diaSemana,
          horario: `${conflicto.horaInicio} - ${conflicto.horaFin}`
        }
      });
    }

    // Crear la clase
    const claseData = {
      materia,
      profesor,
      anio: parseInt(anio),
      diaSemana,
      horaInicio,
      horaFin
    };

    console.log("Creando clase con datos:", claseData);
    
    const clase = new Clase(claseData);
    await clase.save();

    console.log("Clase creada exitosamente:", clase._id);

    // Popular los datos para la respuesta
    await clase.populate([
      { path: "materia", select: "nombre codigo" },
      { path: "profesor", select: "nombre email" }
    ]);

    res.status(201).json({ 
      msg: "Clase creada correctamente", 
      clase: clase.obtenerInfoCompleta()
    });

  } catch (error) {
    console.error("=== ERROR AL CREAR CLASE ===");
    console.error("Error completo:", error);
    console.error("Stack:", error.stack);
    
    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map(err => ({
        campo: err.path,
        mensaje: err.message,
        valorRecibido: err.value
      }));
      
      console.log("Errores de validación:", errores);
      
      return res.status(400).json({ 
        msg: "Error de validación", 
        errores,
        detalles: errores.map(e => e.mensaje)
      });
    }

    // Manejar errores de duplicado (si hay índices únicos)
    if (error.code === 11000) {
      console.log("Error de duplicado:", error.keyValue);
      return res.status(400).json({
        msg: "Ya existe una clase con estos datos",
        camposDuplicados: error.keyValue
      });
    }

    // Error genérico
    res.status(500).json({ 
      msg: "Error interno del servidor", 
      error: error.message,
      tipo: error.name
    });
  }
};

// Obtener todas las clases (admin)
export const obtenerTodasLasClases = async (req, res) => {
  try {
    console.log("=== OBTENER TODAS LAS CLASES ===");
    
    const { anio, materia, profesor, diaSemana } = req.query;
    let filtros = {};

    // Aplicar filtros si se proporcionan
    if (anio) filtros.anio = parseInt(anio);
    if (materia) filtros.materia = materia;
    if (profesor) filtros.profesor = profesor;
    if (diaSemana) filtros.diaSemana = diaSemana;

    console.log("Filtros aplicados:", filtros);

    const clases = await Clase.find(filtros)
      .populate("materia", "nombre codigo")
      .populate("profesor", "nombre email")
      .sort({ diaSemana: 1, horaInicio: 1 });

    console.log(`Clases encontradas: ${clases.length}`);

    res.json({
      msg: "Clases obtenidas correctamente",
      clases: clases.map(clase => clase.obtenerInfoCompleta()),
      total: clases.length,
      filtros: filtros
    });

  } catch (error) {
    console.error("Error al obtener clases:", error);
    res.status(500).json({ 
      msg: "Error al obtener clases", 
      error: error.message 
    });
  }
};

// Obtener clases por profesor
export const obtenerClasesProfesor = async (req, res) => {
  try {
    console.log("=== OBTENER CLASES POR PROFESOR ===");
   
    const profesorId = req.user.id; // viene de checkAuth
    console.log("ID del profesor:", profesorId);
   
    const clases = await Clase.find({ profesor: profesorId })
      .populate("materia", "nombre codigo")
      .populate("profesor", "nombre email")
      .sort({ diaSemana: 1, horaInicio: 1 });
      
    console.log(`Clases encontradas para el profesor: ${clases.length}`);
    
    res.json({
      msg: "Clases obtenidas correctamente",
      clases: clases.map(clase => {
        // Verificar si el método existe antes de usarlo
        if (typeof clase.obtenerInfoCompleta === 'function') {
          return clase.obtenerInfoCompleta();
        } else {
          // Devolver información básica si no existe el método
          return {
            _id: clase._id,
            materia: clase.materia,
            profesor: clase.profesor,
            diaSemana: clase.diaSemana,
            horaInicio: clase.horaInicio,
            horaFin: clase.horaFin,
            aula: clase.aula,
            // Agregar otros campos que necesites
          };
        }
      }),
      total: clases.length,
      profesor: {
        id: profesorId,
        nombre: req.user.nombre
      }
    });
    
  } catch (error) {
    console.error("Error al obtener clases del profesor:", error);
    res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message
    });
  }
};

// Actualizar clase (solo admin)
export const actualizarClase = async (req, res) => {
  try {
    console.log("=== ACTUALIZAR CLASE ===");
    
    const { id } = req.params;
    const datosActualizacion = req.body;

    console.log("ID de clase a actualizar:", id);
    console.log("Datos para actualizar:", datosActualizacion);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de clase inválido" });
    }

    // Verificar que la clase existe
    const claseExistente = await Clase.findById(id);
    if (!claseExistente) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    // Si se actualiza el horario, verificar conflictos
    if (datosActualizacion.profesor || datosActualizacion.diaSemana || 
        datosActualizacion.horaInicio || datosActualizacion.horaFin) {
      
      const profesorId = datosActualizacion.profesor || claseExistente.profesor;
      const diaSemana = datosActualizacion.diaSemana || claseExistente.diaSemana;
      const horaInicio = datosActualizacion.horaInicio || claseExistente.horaInicio;
      const horaFin = datosActualizacion.horaFin || claseExistente.horaFin;

      const conflicto = await Clase.verificarConflictoHorario(
        profesorId, 
        diaSemana, 
        horaInicio, 
        horaFin,
        id // Excluir la clase actual
      );

      if (conflicto) {
        return res.status(400).json({ 
          msg: "Conflicto de horario con otra clase",
          claseConflicto: conflicto.obtenerInfoCompleta()
        });
      }
    }

    // Actualizar la clase
    const claseActualizada = await Clase.findByIdAndUpdate(
      id,
      datosActualizacion,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate([
      { path: "materia", select: "nombre codigo" },
      { path: "profesor", select: "nombre email" }
    ]);

    console.log("Clase actualizada exitosamente");

    res.json({
      msg: "Clase actualizada correctamente",
      clase: claseActualizada.obtenerInfoCompleta()
    });

  } catch (error) {
    console.error("Error al actualizar clase:", error);
    
    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        msg: "Error de validación", 
        errores 
      });
    }

    res.status(500).json({ 
      msg: "Error al actualizar clase", 
      error: error.message 
    });
  }
};

// Eliminar clase (solo admin)
export const eliminarClase = async (req, res) => {
  try {
    console.log("=== ELIMINAR CLASE ===");
    
    const { id } = req.params;
    console.log("ID de clase a eliminar:", id);

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de clase inválido" });
    }

    const claseEliminada = await Clase.findByIdAndDelete(id);
    
    if (!claseEliminada) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    console.log("Clase eliminada exitosamente");

    res.json({
      msg: "Clase eliminada correctamente",
      claseEliminada: claseEliminada.obtenerInfoCompleta()
    });

  } catch (error) {
    console.error("Error al eliminar clase:", error);
    res.status(500).json({ 
      msg: "Error al eliminar clase", 
      error: error.message 
    });
  }
};

// Obtener clase por ID
export const obtenerClasePorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de clase inválido" });
    }

    const clase = await Clase.findById(id)
      .populate("materia", "nombre codigo descripcion")
      .populate("profesor", "nombre email telefono");

    if (!clase) {
      return res.status(404).json({ msg: "Clase no encontrada" });
    }

    res.json({
      msg: "Clase encontrada",
      clase: clase.obtenerInfoCompleta()
    });

  } catch (error) {
    console.error("Error al obtener clase:", error);
    res.status(500).json({ 
      msg: "Error al obtener clase", 
      error: error.message 
    });
  }
};