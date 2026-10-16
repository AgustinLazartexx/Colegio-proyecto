import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Clase = sequelize.define('Clase', {
  anio: { type: DataTypes.INTEGER, allowNull: false },
  division: { type: DataTypes.STRING, allowNull: false },
  diaSemana: { type: DataTypes.STRING, allowNull: false },
  horaInicio: { type: DataTypes.STRING, allowNull: false },
  horaFin: { type: DataTypes.STRING, allowNull: false },
  duracion: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true });

export default Clase;
