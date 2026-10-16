import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/mariadb.js';

export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await sequelize.query('SELECT * FROM usuarios', {
      type: QueryTypes.SELECT,
    });
    res.json(usuarios);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).send('Error del servidor');
  }
};
