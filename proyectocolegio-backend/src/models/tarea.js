import mongoose from "mongoose";

const tareaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
    },
    fechaEntrega: {
      type: Date,
      required: true,
    },
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Materia",
      required: true,
    },
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    archivo: {
      type: String, // Ruta o nombre del archivo
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Tarea", tareaSchema);
