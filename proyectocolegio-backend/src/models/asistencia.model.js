import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Asistencia = sequelize.define('Asistencia', {
  fecha: { type: DataTypes.DATE, allowNull: false },
  presente: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

export default Asistencia;