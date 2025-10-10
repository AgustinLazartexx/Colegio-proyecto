import mongoose from "mongoose";

const anuncioSchema = new mongoose.Schema({
  profesor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  materia: { type: mongoose.Schema.Types.ObjectId, ref: "Materia", required: true },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Anuncio", anuncioSchema);
