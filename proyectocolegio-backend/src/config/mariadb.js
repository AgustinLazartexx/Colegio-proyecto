import dotenv from 'dotenv';
import mariadb from 'mariadb';
import { Sequelize } from 'sequelize';
import { translatePostgresDdl } from '../database/postgresCompat.js';

dotenv.config();

const DB_DIALECT = process.env.DB_DIALECT || 'mariadb';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_NAME = process.env.DB_NAME || 'colegio';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || process.env.DB_PASS || '';
const logging = process.env.NODE_ENV !== 'production' ? console.log : false;

if (!['mariadb', 'postgres'].includes(DB_DIALECT)) {
  throw new Error(`DB_DIALECT no soportado: ${DB_DIALECT}. Usa mariadb o postgres.`);
}

if (DB_DIALECT === 'postgres' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL es obligatoria cuando DB_DIALECT=postgres.');
}

const postgresDialectOptions =
  DB_DIALECT === 'postgres' &&
  process.env.DATABASE_URL &&
  !/sslmode=/i.test(process.env.DATABASE_URL) &&
  process.env.NODE_ENV === 'production'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined;

const sequelize = DB_DIALECT === 'postgres'
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      ...(postgresDialectOptions ? { dialectOptions: postgresDialectOptions } : {}),
      logging,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'mariadb',
      dialectOptions: {
        allowPublicKeyRetrieval: true,
      },
      logging,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    });

const pool = DB_DIALECT === 'postgres'
  ? { end: async () => {} }
  : mariadb.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      port: DB_PORT,
      connectionLimit: 5,
      allowPublicKeyRetrieval: true,
    });

if (DB_DIALECT === 'postgres') {
  const executeQuery = sequelize.query.bind(sequelize);
  sequelize.query = async (input, options) => {
    const { sql, indexes } = translatePostgresDdl(input);
    const result = await executeQuery(sql, options);
    for (const indexSql of indexes) {
      await executeQuery(indexSql, options);
    }
    if (
      !options?.type &&
      Array.isArray(result) &&
      result.length === 2 &&
      result[1] &&
      typeof result[1].rowCount === 'number' &&
      result[0] &&
      typeof result[0] === 'object' &&
      !('affectedRows' in result[0])
    ) {
      result[0].affectedRows = result[1].rowCount;
    }
    return result;
  };
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ ${DB_DIALECT === 'postgres' ? 'PostgreSQL' : 'MariaDB'} connection established`);
  } catch (err) {
    console.error(`❌ ${DB_DIALECT === 'postgres' ? 'PostgreSQL' : 'MariaDB'} connection failed:`, err);
    throw err;
  }
};

export { sequelize, Sequelize, testConnection, pool, DB_DIALECT };
export default pool;
