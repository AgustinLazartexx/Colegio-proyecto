import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const User = sequelize.define('User', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.ENUM('alumno', 'profesor', 'admin'), allowNull: false },
  dni: { type: DataTypes.STRING, allowNull: true, unique: true },
  codigoAlumno: { type: DataTypes.STRING, allowNull: true, unique: true },
  anio: { type: DataTypes.INTEGER, allowNull: true },
  division: { type: DataTypes.STRING, allowNull: true },
  mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  acceso_habilitado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true });

export default User;