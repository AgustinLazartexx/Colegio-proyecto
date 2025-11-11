import mongoose from "mongoose";

const materiaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    anio: {
      type: Number,
      required: true,
      min: 0, // 0 se usa para "Asistencia General"
      max: 6,
    },
    // --- CAMPO NUEVO ---
    division: {
      type: String,
      uppercase: true,
      trim: true,
      enum: ["A", "B", "C", null], // A, B, C, o null (para anio 0)
      default: null
    },
    // --- FIN CAMPO NUEVO ---
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    alumnos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// --- NUEVO ÍNDICE DE UNICIDAD ---
// Evita crear "Matemática 1ro A" dos veces
materiaSchema.index({ nombre: 1, anio: 1, division: 1 }, { unique: true });


export default mongoose.model("Materia", materiaSchema);