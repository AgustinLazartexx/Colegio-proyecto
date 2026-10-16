const mariadb = require('mariadb');
require('dotenv').config();

(async function() {
  const conn = await mariadb.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'colegio'
  });

  try {
    const tables = await conn.query('SHOW TABLES');
    console.log('tables:', tables);
    const users = await conn.query('SHOW CREATE TABLE Users');
    console.log('users create:', users);
    const materias = await conn.query('SHOW CREATE TABLE Materias');
    console.log('materias create:', materias);
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
})();
