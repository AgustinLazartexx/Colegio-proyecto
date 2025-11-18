// src/models/Clases.js
import mongoose from "mongoose";

const claseSchema = new mongoose.Schema({
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Materia",
    required: [true, "La materia es requerida"]
  },
  profesores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  
  // --- CAMPO AÑADIDO ---
  // La lista de alumnos inscritos a ESTA clase específica
  alumnos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // --- FIN CAMPO AÑADIDO ---

  anio: {
    type: Number,
    required: [true, "El año de cursada es requerido"],
    min: [0, "El año de cursada debe ser mínimo 0 (para general)"],
    max: [6, "El año de cursada debe ser máximo 6"],
    validate: {
      validator: (v) => Number.isInteger(v) && v >= 0 && v <= 6,
      message: props => `${props.value} no es un año válido (0-6)`
    }
  },
  division: {
    type: String,
    required: [true, "La división es requerida (ej. A, B, C)"],
    uppercase: true,
    trim: true,
  },
  diaSemana: {
    type: String,
    enum: {
       values: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
       message: "El día de la semana no es válido"
     },
    required: [true, "El día de la semana es requerido"]
  },
  horaInicio: {
    type: String,
    required: [true, "La hora de inicio es requerida"],
    validate: {
      validator: function(v) { return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); },
      message: "El formato de hora de inicio debe ser HH:MM"
    }
  },
  horaFin: {
    type: String,
    required: [true, "La hora de fin es requerida"],
    validate: {
      validator: function(v) { return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); },
      message: "El formato de hora de fin debe ser HH:MM"
    }
  },
  duracion: {
    type: Number
  }
}, {
  timestamps: true
});

// ... (tus 'pre' y 'statics' existentes están bien) ...

// Validación horaInicio < horaFin y cálculo de duración
claseSchema.pre('validate', function(next) {
 if (this.horaInicio && this.horaFin) {
   const [inicioHora, inicioMin] = this.horaInicio.split(':').map(Number);
   const [finHora, finMin] = this.horaFin.split(':').map(Number);
   const inicioMinutos = inicioHora * 60 + inicioMin;
   const finMinutos = finHora * 60 + finMin;
   if (inicioMinutos >= finMinutos) {
     next(new Error('La hora de inicio debe ser menor que la hora de fin'));
     return;
   }
   this.duracion = finMinutos - inicioMinutos;
 }
 next();
});

// Índices
claseSchema.index({ materia: 1, anio: 1, division: 1, diaSemana: 1, horaInicio: 1 }, { unique: true });
claseSchema.index({ profesores: 1, diaSemana: 1, horaInicio: 1 });

// Método estático para verificar conflictos (NECESARIO)
claseSchema.statics.verificarConflictoHorario = async function (
  profesores,
  diaSemana,
  horaInicio,
  horaFin,
  claseIdAExcluir = null
) {
  try {
    const filtroConflicto = {
      profesores: { $in: profesores },
      diaSemana: diaSemana,
      $or: [
        {
          horaInicio: { $lt: horaFin },
          horaFin: { $gt: horaInicio },
        },
      ],
    };

    if (claseIdAExcluir) {
      filtroConflicto._id = { $ne: claseIdAExcluir };
    }

    const conflicto = await this.findOne(filtroConflicto).populate(
      'profesores',
      'nombre apellido'
    );

    return conflicto;
  } catch (error) {
    console.error('Error en verificarConflictoHorario:', error);
    throw new Error('Error al verificar conflictos de horario');
  }
};

claseSchema.methods.obtenerInfoCompleta = function() {
  return {
    id: this._id,
    materia: this.materia,
    profesores: this.profesores,
    alumnos: this.alumnos, // <-- Devolvemos los alumnos
    anio: this.anio,
    anioCursada: `${this.anio}° Año`,
    division: this.division,
    diaSemana: this.diaSemana,
    horario: `${this.horaInicio} - ${this.horaFin}`,
    duracion: this.duracion,
    fechaCreacion: this.createdAt,
    fechaActualizacion: this.updatedAt
  };
};

const Clase = mongoose.model("Clase", claseSchema);
export default Clase;