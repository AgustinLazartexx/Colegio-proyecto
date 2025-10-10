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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
