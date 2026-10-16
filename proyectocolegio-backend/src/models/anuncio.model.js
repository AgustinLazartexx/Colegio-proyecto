import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

const Anuncio = sequelize.define('Anuncio', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  contenido: { type: DataTypes.TEXT, allowNull: false }
}, { timestamps: true });

export default Anuncio;
