import { createRequire } from 'node:module';
import { pool, sequelize, Sequelize } from '../config/mariadb.js';

const require = createRequire(import.meta.url);
const migration = require('../database/migrations/20261015-12-add-user-auth-columns.cjs');

try {
  await sequelize.authenticate();
  await migration.up(sequelize.getQueryInterface(), Sequelize);
  console.log('Columnas de autenticación listas en MariaDB.');
} catch (error) {
  console.error('No se pudieron preparar las columnas de autenticación:', error);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
