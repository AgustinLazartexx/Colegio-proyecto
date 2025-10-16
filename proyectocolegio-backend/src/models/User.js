import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: {
      type: String,
      enum: ["alumno", "profesor", "admin"],
      default: "alumno",
    },
       // 🆕 Campos nuevos
    anio: { type: Number, min: 1, max: 6 },
    division: { type: String, enum: ["A", "B", "C"], uppercase: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
