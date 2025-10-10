import mongoose from "mongoose";

const asistenciaSchema = new mongoose.Schema({
  materia: { // Cambiado de clase a materia
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Materia", // Cambiado de "Clase" a "Materia"
    required: [true, "La materia es requerida"],
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
    default: () => {
      const fecha = new Date();
      fecha.setHours(0, 0, 0, 0); // Normalizar a medianoche
      return fecha;
    },
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
  // quién cargó (auditoría)
  cargadoPor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "El usuario que carga es requerido"]
  }
}, { 
  timestamps: true,
  // Optimización para consultas
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice compuesto único para evitar duplicados
asistenciaSchema.index(
  { materia: 1, alumno: 1, fecha: 1 }, // Cambiado de clase a materia
  { 
    unique: true,
    name: "unique_asistencia_por_dia_materia"
  }
);

// Índices adicionales para mejorar performance
asistenciaSchema.index({ fecha: -1 }); // Para ordenar por fecha
asistenciaSchema.index({ materia: 1, fecha: -1 }); // Para filtrar por materia y fecha
asistenciaSchema.index({ alumno: 1, fecha: -1 }); // Para filtrar por alumno y fecha

// Middleware pre-save para validaciones adicionales
asistenciaSchema.pre('save', function(next) {
  // Normalizar fecha a medianoche si no está normalizada
  if (this.fecha) {
    this.fecha.setHours(0, 0, 0, 0);
  }
  next();
});

// Método estático para buscar asistencias por rango de fechas
asistenciaSchema.statics.findByDateRange = function(startDate, endDate, additionalFilters = {}) {
  const query = {
    fecha: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    ...additionalFilters
  };
  
  return this.find(query)
    .populate("materia", "nombre codigo profesor") // Cambiado de clase a materia
    .populate("alumno", "nombre email")
    .populate("cargadoPor", "nombre")
    .sort({ fecha: -1 });
};

// Método estático para obtener estadísticas de asistencia
asistenciaSchema.statics.getEstadisticasAlumno = function(alumnoId, materiaId = null) {
  const match = { alumno: new mongoose.Types.ObjectId(alumnoId) };
  if (materiaId) {
    match.materia = new mongoose.Types.ObjectId(materiaId); // Cambiado de clase a materia
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$estado",
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$count" },
        estadisticas: {
          $push: {
            estado: "$_id",
            cantidad: "$count"
          }
        }
      }
    }
  ]);
};

export default mongoose.model("Asistencia", asistenciaSchema);