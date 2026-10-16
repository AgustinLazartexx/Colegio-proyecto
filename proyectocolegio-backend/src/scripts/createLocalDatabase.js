import mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();

const databaseName = process.env.DB_NAME || "colegio";
if (!/^[a-zA-Z0-9_$-]+$/.test(databaseName)) {
  throw new Error("DB_NAME contiene caracteres no admitidos para crear la base local.");
}

let connection;
try {
  connection = await mariadb.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  });
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`Base de datos local "${databaseName}" lista.`);
} catch (error) {
  console.error("No se pudo crear la base de datos local:", error);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
