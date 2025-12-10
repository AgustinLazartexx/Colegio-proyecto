import mongoose from "mongoose";

const cuotaSchema = new mongoose.Schema({
  alumno: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  mes: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 12 
  },
  anio: { 
    type: Number, 
    required: true 
  },
  monto: { 
    type: Number, 
    required: true 
  },
  estado: {
    type: String,
    enum: ["pendiente", "pagado", "vencido"],
    default: "pendiente"
  },
  fechaVencimiento: { 
    type: Date, 
    required: true 
  },
  fechaPago: { 
    type: Date 
  },
  metodoPago: {
    type: String,
    enum: ["efectivo", "transferencia", "tarjeta"],
    default: null
  }
}, { 
  timestamps: true 
});

// Evitar crear dos cuotas para el mismo mes/año al mismo alumno
cuotaSchema.index({ alumno: 1, mes: 1, anio: 1 }, { unique: true });

export default mongoose.model("Cuota", cuotaSchema);