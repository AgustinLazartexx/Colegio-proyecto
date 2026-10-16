import { QueryTypes } from "sequelize";
import { sequelize } from "../config/mariadb.js";

export const isDatabaseId = (id) =>
  typeof id === "string" && /^[\da-f]{32}$/i.test(id.replaceAll("-", ""));

export const databaseId = (id) => id.replaceAll("-", "").toUpperCase();

export const findActiveUser = async (id, role) => {
  const [user] = await sequelize.query(
    `SELECT HEX(id) AS id, nombre, email, rol, anio, division
     FROM users WHERE id = UNHEX(:id) AND rol = :role AND isActive = TRUE LIMIT 1`,
    {
      replacements: { id: databaseId(id), role },
      type: QueryTypes.SELECT,
    },
  );
  return user ?? null;
};

export const queryType = QueryTypes;
export { sequelize };
