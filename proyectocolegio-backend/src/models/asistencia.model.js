import mongoose from "mongoose";

const asistenciaSchema = new mongoose.Schema({
  // CORRECCIÓN: La asistencia pertenece a una "Clase" (una hora/materia específica)
  clase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Clase", // <-- DEBE SER "Clase"
    required: [true, "La clase es requerida"],
    index: true
  },
  alumno: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "El alumno es requerido"],
    index: true
  },
  fecha: { 
    type: Date, 
    required: [true, "La fecha es requerida"],
    index: true
  },
  estado: {
    type: String,
    enum: {
      values: ["presente", "ausente", "tarde", "justificado"],
      message: "El estado debe ser: presente, ausente, tarde o justificado"
    },
    required: [true, "El estado es requerido"]
  },
  // Opcional: quién cargó la asistencia
  cargadoPor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { 
  timestamps: true
});

// Índice compuesto único para evitar duplicados
asistenciaSchema.index(
  { clase: 1, alumno: 1, fecha: 1 }, // <-- DEBE SER "clase"
  { 
    unique: true,
    name: "unique_asistencia_por_dia_clase"
  }
);

// Middleware pre-save para normalizar fecha
asistenciaSchema.pre('save', function(next) {
  if (this.fecha) {
    this.fecha.setUTCHours(0, 0, 0, 0); // Normalizar a UTC
  }
  next();
});

export default mongoose.model("Asistencia", asistenciaSchema);