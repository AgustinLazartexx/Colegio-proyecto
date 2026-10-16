import { createRequire } from "node:module";
import { DB_DIALECT, pool, sequelize } from "../config/mariadb.js";

const require = createRequire(import.meta.url);
const coreSchema = require("../database/migrations/20261015-00-create-core-schema.cjs");
const authColumns = require("../database/migrations/20261015-12-add-user-auth-columns.cjs");
const migration = require("../database/migrations/20261015-13-create-academic-relations.cjs");
const relationalModules = require("../database/migrations/20261015-14-create-relational-school-modules.cjs");
const generalAttendance = require("../database/migrations/20261015-15-create-general-attendance.cjs");

try {
  await sequelize.authenticate();
  await coreSchema.up(sequelize.getQueryInterface(), sequelize.constructor);
  await authColumns.up(sequelize.getQueryInterface(), sequelize.constructor);
  await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
  await relationalModules.up(sequelize.getQueryInterface(), sequelize.constructor);
  await generalAttendance.up(sequelize.getQueryInterface(), sequelize.constructor);
  console.log(`Esquema local y todos los módulos académicos listos en ${DB_DIALECT === "postgres" ? "PostgreSQL" : "MariaDB"}.`);
} catch (error) {
  console.error("No se pudieron preparar las tablas académicas:", error);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
