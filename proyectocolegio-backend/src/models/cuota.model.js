import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Cuota = sequelize.define('Cuota', {
  monto: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  fechaVencimiento: { type: DataTypes.DATE, allowNull: true },
  pagado: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

export default Cuota;
