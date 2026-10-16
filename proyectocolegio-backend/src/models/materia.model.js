import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Materia = sequelize.define('Materia', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  anio: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true });

export default Materia;