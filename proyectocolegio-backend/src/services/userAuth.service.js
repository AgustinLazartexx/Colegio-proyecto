import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/mariadb.js';

const selectUserFields = `
  HEX(id) AS id,
  nombre,
  email,
  password,
  rol,
  anio,
  division,
  isActive,
  mustChangePassword,
  acceso_habilitado
`;

export const findUserByEmail = async (email) => {
  const users = await sequelize.query(
    `SELECT ${selectUserFields} FROM users WHERE email = :email LIMIT 1`,
    {
      replacements: { email: email.trim().toLowerCase() },
      type: QueryTypes.SELECT,
    },
  );

  return users[0] ?? null;
};

export const findUserById = async (id) => {
  if (typeof id !== 'string' || !/^[\da-f]{32}$/i.test(id)) {
    return null;
  }

  const users = await sequelize.query(
    `SELECT ${selectUserFields} FROM users WHERE id = UNHEX(:id) LIMIT 1`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    },
  );

  return users[0] ?? null;
};

export const toPublicUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  rol: user.rol,
  anio: user.anio,
  division: user.division,
  mustChangePassword: Boolean(user.mustChangePassword),
});
