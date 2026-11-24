import dotenv from 'dotenv';
import mariadb from 'mariadb';
import { Sequelize } from 'sequelize';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_NAME = process.env.DB_NAME || 'colegio';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || process.env.DB_PASS || '';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mariadb',
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

const DB_DIALECT = sequelize.getDialect();
const pool = mariadb.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  port: DB_PORT,
  connectionLimit: 5,
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MariaDB connection established');
  } catch (err) {
    console.error('❌ MariaDB connection failed:', err);
    throw err;
  }
};

export { sequelize, Sequelize, testConnection, pool, DB_DIALECT };
export default pool;
