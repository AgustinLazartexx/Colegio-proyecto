// models/notaTrimestral.model.js
import mongoose from "mongoose";

// --- Constantes de Ponderación ---
const W_ORIENTADORA = 0.15; // 15%
const W_PROCESO = 0.25;     // 25%
const W_INTEGRADORA = 0.60; // 60%

const notaTrimestralSchema = new mongoose.Schema({
  materia: { type: mongoose.Schema.Types.ObjectId, ref: "Materia", required: true, index: true },
  alumno:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
  trimestre: { type: Number, required: true, min: 1, max: 3, index: true },

  // --- Notas de Entrada (cargadas por el profesor) ---
  orientadora: { type: Number, min: 0, max: 10 },
  proceso:     { type: Number, min: 0, max: 10 },
  integradora: { type: Number, min: 0, max: 10 },
  recuperacion: { type: Number, min: 0, max: 10 }, // Nota "cruda" del examen

  // --- Notas Calculadas (automáticas) ---
  promedioPonderado: { type: Number },
  notaFinalTrimestre: { type: Number },

  // --- NUEVOS CAMPOS ---
  // Para el flujo de Admin (Profesor carga, Admin revisa)
  observacion: { type: String, trim: true }, // Observación del profesor o admin
  isAprobadaAdmin: { type: Boolean, default: false }, // El admin marca esto
  isBloqueada: { type: Boolean, default: false }, // El admin cierra el trimestre

  actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });


// Clave única para evitar duplicados
notaTrimestralSchema.index({ materia: 1, alumno: 1, trimestre: 1 }, { unique: true });

// --- LÓGICA DE CÁLCULO AUTOMÁTICO ---
notaTrimestralSchema.pre("save", function (next) {
  this.promedioPonderado = null;
  this.notaFinalTrimestre = null;

  // 1. Calcular Promedio Ponderado (si están las 3 notas)
  const o = this.orientadora;
  const p = this.proceso;
  const i = this.integradora;
  
  if (o !== null && o !== undefined && 
      p !== null && p !== undefined && 
      i !== null && i !== undefined) 
  {
    const promedio = (o * W_ORIENTADORA) + (p * W_PROCESO) + (i * W_INTEGRADORA);
    // Guardamos el promedio exacto, sin redondear
    this.promedioPonderado = promedio; 
  }

  // 2. Calcular Nota Final del Trimestre
  const r = this.recuperacion;

  if (r !== null && r !== undefined) {
    // A. Hay nota de recuperación, esta DEFINE la nota final
    if (r >= 6) {
      // Aprobado, la nota no puede superar 7
      this.notaFinalTrimestre = Math.min(r, 7);
    } else {
      // Desaprobado, la nota es 5
      this.notaFinalTrimestre = 5;
    }
  } else if (this.promedioPonderado !== null) {
    // B. No hay recuperación, la nota final es el promedio ponderado
    this.notaFinalTrimestre = this.promedioPonderado;
  }
  
  // Si no hay recuperación Y tampoco están las 3 notas, la notaFinal es null

  next();
});


export default mongoose.model("NotaTrimestral", notaTrimestralSchema);