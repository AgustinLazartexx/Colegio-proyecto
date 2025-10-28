// models/auditoriaNota.model.js
import mongoose from "mongoose";

const auditoriaNotaSchema = new mongoose.Schema({
  notaOriginalId: { type: mongoose.Schema.Types.ObjectId, ref: "NotaTrimestral", required: true, index: true },
  materia: { type: mongoose.Schema.Types.ObjectId, ref: "Materia", required: true, index: true },
  alumno:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
  trimestre: { type: Number, required: true },

  // Qué campo se cambió
  campoModificado: { type: String, required: true }, // ej: "integradora"
  
  // Valores
  valorAnterior: { type: String },
  valorNuevo: { type: String },

  // Quién lo hizo
  modificadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { timestamps: true });


export default mongoose.model("AuditoriaNota", auditoriaNotaSchema);