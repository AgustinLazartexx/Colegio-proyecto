import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  rol: { type: String, enum: ["alumno", "profesor", "admin"], required: true },
}, {
  timestamps: true
});

export default mongoose.model("Usuario", userSchema);
