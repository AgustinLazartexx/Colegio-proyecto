// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Asegúrate de tenerlo: npm install bcryptjs

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ["alumno", "profesor", "admin"],
    required: true // Hacemos que el rol sea siempre requerido
  },
  
  // --- CAMPOS NUEVOS/MODIFICADOS ---
  dni: { type: String, unique: true, sparse: true, trim: true }, // unique pero sparse permite nulls
  codigoAlumno: { type: String, unique: true, sparse: true, trim: true }, // Código de 4 dígitos
  anio: { type: Number, min: 1, max: 6 }, // Año del alumno (usado también por materia)
  division: { type: String, uppercase: true, trim: true }, // División del alumno (puede ser null para profes/admin)
  mustChangePassword: { type: Boolean, default: true }, // Forzar cambio al inicio
  isActive: { type: Boolean, default: true } // Para deshabilitar
  // --- FIN CAMPOS NUEVOS/MODIFICADOS ---

}, { timestamps: true });

// Hash password antes de guardar
userSchema.pre("save", async function (next) {
  // Solo hashear si la contraseña fue modificada (o es nueva)
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Asegurarse de que enteredPassword sea string
  return await bcrypt.compare(String(enteredPassword), this.password);
};

// Método estático para generar el código de alumno (4 dígitos)
userSchema.statics.generarCodigoAlumno = async function(anio, division) {
    const ultimoAlumno = await this.findOne({ anio, division, rol: 'alumno' })
                                  .sort({ codigoAlumno: -1 }) // Último código para ese año/div
                                  .select('codigoAlumno')
                                  .lean();

    let nuevoNumero = 1;
    if (ultimoAlumno && ultimoAlumno.codigoAlumno) {
        const ultimoNumero = parseInt(ultimoAlumno.codigoAlumno, 10);
        if (!isNaN(ultimoNumero)) {
            nuevoNumero = ultimoNumero + 1;
        }
    }
    // Formatear a '0001', '0002', ..., '0010', ... '0100', etc.
    return String(nuevoNumero).padStart(4, '0');
};

export default mongoose.model("User", userSchema);