// models/Clases.js
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

  // --- CORRECCIÓN: Definición única de 'anio' con validate ---
  anio: {
    type: Number,
    required: [true, "El año de cursada es requerido"],
    min: [1, "El año de cursada debe ser mínimo 1"],
    max: [6, "El año de cursada debe ser máximo 6"],
    validate: {
      validator: (v) => Number.isInteger(v) && v >= 1 && v <= 6, // Función flecha
      message: props => `${props.value} no es un año de cursada válido (debe ser entero entre 1 y 6)`
    }
  },
  // --- FIN CORRECCIÓN ---

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
  // --- CORRECCIÓN: Definición completa de 'duracion' ---
  duracion: {
    type: Number,
    default: function() {
      // Calcular duración automáticamente
      if (this.horaInicio && this.horaFin) {
        const [inicioHora, inicioMin] = this.horaInicio.split(':').map(Number);
        const [finHora, finMin] = this.horaFin.split(':').map(Number);
        const inicioMinutos = inicioHora * 60 + inicioMin;
        const finMinutos = finHora * 60 + finMin;
        // Basic check, full validation is in pre('validate')
        return finMinutos > inicioMinutos ? finMinutos - inicioMinutos : 0;
      }
      return undefined; // O null
    }
  } // <-- Coma necesaria aquí
  // --- FIN CORRECCIÓN ---
}, {
  timestamps: true
});

// --- EL RESTO DEL MODELO DEBERÍA ESTAR AQUÍ ---
// Validación horaInicio < horaFin
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
   // Actualizar duración solo si es válida
   this.duracion = finMinutos - inicioMinutos;
 }
 next();
});

// Índices
claseSchema.index({ materia: 1, anio: 1, division: 1, diaSemana: 1, horaInicio: 1 }, { unique: true });
claseSchema.index({ profesores: 1, diaSemana: 1, horaInicio: 1 });

// Método estático para verificar conflictos
claseSchema.statics.verificarConflictoHorario = async function(profesoresIds, diaSemana, horaInicio, horaFin, excluirId = null) {
  const ids = Array.isArray(profesoresIds) ? profesoresIds : [profesoresIds];
  if (ids.length === 0) return null;
  const query = {
    profesores: { $in: ids },
    diaSemana: diaSemana,
    $or: [
       { $and: [ { horaInicio: { $lte: horaInicio } }, { horaFin: { $gt: horaInicio } } ] },
       { $and: [ { horaInicio: { $lt: horaFin } },    { horaFin: { $gte: horaFin } } ] },
       { $and: [ { horaInicio: { $gte: horaInicio } }, { horaFin: { $lte: horaFin } } ] }
    ]
  };
  if (excluirId) {
    query._id = { $ne: excluirId };
  }
  return await this.findOne(query).populate('profesores', 'nombre');
};

// Método de instancia para obtener info
claseSchema.methods.obtenerInfoCompleta = function() {
  return {
    id: this._id,
    materia: this.materia,
    profesores: this.profesores,
    anio: this.anio,
    anioCursada: `${this.anio}° Año`,
    division: this.division,
    diaSemana: this.diaSemana,
    horario: `${this.horaInicio} - ${this.horaFin}`,
    duracion: `${this.duracion} minutos`,
    fechaCreacion: this.createdAt,
    fechaActualizacion: this.updatedAt
  };
};
// --- FIN DEL RESTO DEL MODELO ---

export default mongoose.model("Clase", claseSchema);