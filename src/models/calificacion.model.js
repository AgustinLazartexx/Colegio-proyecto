import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Calificacion = sequelize.define('Calificacion', {
  nota: { type: DataTypes.DECIMAL(5,2), allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: true },
  comentario: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true });

export default Calificacion;
