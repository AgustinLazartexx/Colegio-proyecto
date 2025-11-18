// src/models/user.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  rol: { type: String, enum: ["alumno", "profesor", "admin"], required: true },
  
  // --- CAMPOS AÑADIDOS ---
  // Solo aplicarán si el rol es 'alumno'
  anio: { 
    type: Number, 
    min: 1, 
    max: 6,
    default: null 
  },
  division: { 
    type: String, 
    uppercase: true, 
    trim: true,
    default: null
  }
  // --- FIN DE CAMPOS AÑADIDOS ---

}, {
  timestamps: true
});

// Índice para buscar alumnos por curso rápidamente
userSchema.index({ rol: 1, anio: 1, division: 1 });

export default mongoose.model("Usuario", userSchema);