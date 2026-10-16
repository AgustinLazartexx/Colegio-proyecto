import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Tarea = sequelize.define('Tarea', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  fechaEntrega: { type: DataTypes.DATE, allowNull: false },
  archivo: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true });

export default Tarea;
