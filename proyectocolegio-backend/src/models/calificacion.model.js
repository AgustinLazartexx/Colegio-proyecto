import mongoose from "mongoose";

const calificacionSchema = new mongoose.Schema(
  {
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Materia",
      required: true,
    },
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    nota: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    fechaEntrega: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Calificacion", calificacionSchema);
