import mongoose from "mongoose";

const entregaSchema = new mongoose.Schema({
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tarea",
    required: true,
  },
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario", // o "Alumno" si usás otro modelo
    required: true,
  },
  archivo: {
    type: String,
    required: true,
  },
  comentario: {
    type: String,
    trim: true,
  },
  fechaEntrega: {
    type: Date,
    default: Date.now,
  },
  nota: {
    type: Number, // opcional para que el profe corrija después
    min: 1,
    max: 10,
  },
  comentarioProfe: {
  type: String,
  default: "",
},
});

export default mongoose.model("Entrega", entregaSchema);
