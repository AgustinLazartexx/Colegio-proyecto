import mongoose from "mongoose";

const claseSchema = new mongoose.Schema({
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Materia",
    required: [true, "La materia es requerida"]
  },
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "El profesor es requerido"]
  },
  anio: { 
    type: Number, 
    required: [true, "El año de cursada es requerido"],
    min: [1, "El año de cursada debe ser mínimo 1"],
    max: [6, "El año de cursada debe ser máximo 6"],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1 && v <= 6;
      },
      message: "El año de cursada debe ser un número entero entre 1 y 6"
    }
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
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "El formato de hora de inicio debe ser HH:MM"
    }
  },
  horaFin: { 
    type: String, 
    required: [true, "La hora de fin es requerida"],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "El formato de hora de fin debe ser HH:MM"
    }
  },
  duracion: { 
    type: Number, 
    default: function() {
      // Calcular duración automáticamente
      if (this.horaInicio && this.horaFin) {
        const [inicioHora, inicioMin] = this.horaInicio.split(':').map(Number);
        const [finHora, finMin] = this.horaFin.split(':').map(Number);
        
        const inicioMinutos = inicioHora * 60 + inicioMin;
        const finMinutos = finHora * 60 + finMin;
        
        return finMinutos - inicioMinutos;
      }
      return 60;
    }
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Validación personalizada para verificar que horaInicio < horaFin
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
    
    // Actualizar duración
    this.duracion = finMinutos - inicioMinutos;
  }
  next();
});

// Índice compuesto para evitar duplicados y mejorar consultas
claseSchema.index({ profesor: 1, diaSemana: 1, horaInicio: 1 });
claseSchema.index({ materia: 1, anio: 1 });

// Método estático para verificar conflictos de horario
claseSchema.statics.verificarConflictoHorario = async function(profesor, diaSemana, horaInicio, horaFin, excluirId = null) {
  const query = {
    profesor: profesor,
    diaSemana: diaSemana,
    $or: [
      {
        $and: [
          { horaInicio: { $lte: horaInicio } },
          { horaFin: { $gt: horaInicio } }
        ]
      },
      {
        $and: [
          { horaInicio: { $lt: horaFin } },
          { horaFin: { $gte: horaFin } }
        ]
      },
      {
        $and: [
          { horaInicio: { $gte: horaInicio } },
          { horaFin: { $lte: horaFin } }
        ]
      }
    ]
  };

  // Si es una actualización, excluir la clase actual
  if (excluirId) {
    query._id = { $ne: excluirId };
  }

  return await this.findOne(query);
};

// Método de instancia para obtener información formateada
claseSchema.methods.obtenerInfoCompleta = function() {
  return {
    id: this._id,
    materia: this.materia,
    profesor: this.profesor,
    anio: this.anio,
    anioCursada: `${this.anio}° Año`, // Campo adicional para mostrar formato legible
    diaSemana: this.diaSemana,
    horario: `${this.horaInicio} - ${this.horaFin}`,
    duracion: `${this.duracion} minutos`,
    fechaCreacion: this.createdAt,
    fechaActualizacion: this.updatedAt
  };
};

export default mongoose.model("Clase", claseSchema);