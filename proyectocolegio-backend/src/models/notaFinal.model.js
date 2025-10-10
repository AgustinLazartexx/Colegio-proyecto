import mongoose from "mongoose";

const notaSchema = new mongoose.Schema({
  clase:   { type: mongoose.Schema.Types.ObjectId, ref: "Clase", required: true, index: true },
  alumno:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true, index: true },
  trimestre1: { type: Number, min: 1, max: 10 },
  trimestre2: { type: Number, min: 1, max: 10 },
  trimestre3: { type: Number, min: 1, max: 10 },
  notaFinal:  { type: Number, min: 1, max: 10 },
  // auditoría
  actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

notaSchema.index({ clase: 1, alumno: 1 }, { unique: true });

// calcula promedio automáticamente antes de guardar
notaSchema.pre("save", function (next) {
  const nums = [this.trimestre1, this.trimestre2, this.trimestre3].filter(n => typeof n === "number");
  if (nums.length > 0) {
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    this.notaFinal = Math.round(avg * 10) / 10; // 1 decimal
  } else {
    this.notaFinal = undefined;
  }
  next();
});

export default mongoose.model("NotaFinal", notaSchema);
