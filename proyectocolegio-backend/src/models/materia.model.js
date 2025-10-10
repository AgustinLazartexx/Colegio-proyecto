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
      min: 1,
      max: 6,
    },
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

export default mongoose.model("Materia", materiaSchema);