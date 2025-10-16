import mongoose from "mongoose";

const entregaSchema = new mongoose.Schema({
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TareaModel",
    required: true,
  },
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario", // Asegúrate que tu modelo de usuario se llame 'Usuario'
    required: true,
  },
  archivo: {
    type: String, // Nombre del archivo entregado por el alumno
    required: true,
  },
  fechaEntrega: {
    type: Date,
    default: Date.now,
  },
  nota: {
    type: Number,
  },
  comentario: { // Comentario del profesor al corregir
    type: String,
  },
}, { timestamps: true });

// Evitar que un alumno entregue la misma tarea dos veces
entregaSchema.index({ tarea: 1, alumno: 1 }, { unique: true });

export default mongoose.model("Entrega", entregaSchema);