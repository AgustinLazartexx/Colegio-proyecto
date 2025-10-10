// routes/usuarios.js
import pool from '../config/mariadb.js';

export const obtenerUsuarios = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const usuarios = await conn.query('SELECT * FROM usuarios');
    conn.release();
    res.json(usuarios);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).send('Error del servidor');
  }
};
