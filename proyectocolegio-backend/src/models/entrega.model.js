import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Entrega = sequelize.define('Entrega', {
  archivo: { type: DataTypes.STRING, allowNull: true },
  fechaEntrega: { type: DataTypes.DATE, allowNull: true },
  comentario: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true });

export default Entrega;
