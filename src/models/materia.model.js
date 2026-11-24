import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Materia = sequelize.define('Materia', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  anio: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true });

export default Materia;
// src/models/materia.model.js
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
      min: 0, // 0 para "General"
      max: 6,
    },
    division: {
        type: String,
        trim: true,
        default: null
    },
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    // --- CAMPO ELIMINADO ---
    // 'alumnos' ya no va aquí. Irá en el modelo 'Clase'.
    /*
    alumnos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    */
    // --- FIN CAMPO ELIMINADO ---
  },
  {
    timestamps: true,
  }
);

materiaSchema.index({ nombre: 1, anio: 1, division: 1 }, { unique: true });

export default mongoose.model("Materia", materiaSchema);