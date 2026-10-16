import { QueryTypes } from "sequelize";
import { sequelize } from "../config/mariadb.js";

export { sequelize };

export const isDatabaseId = (id) =>
  typeof id === "string" && /^[\da-f]{32}$/i.test(id.replaceAll("-", ""));

export const databaseId = (id) => id.replaceAll("-", "").toUpperCase();

export const newDatabaseIdSql = "UNHEX(REPLACE(UUID(), '-', ''))";

export const queryRows = (sql, replacements = {}, transaction) =>
  sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
    ...(transaction ? { transaction } : {}),
  });

export const executeSql = (sql, replacements = {}, transaction) =>
  sequelize.query(sql, {
    replacements,
    ...(transaction ? { transaction } : {}),
  });

export const normalizeDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  const day = value.slice(0, 10);
  const parsed = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== day ? null : day;
};
