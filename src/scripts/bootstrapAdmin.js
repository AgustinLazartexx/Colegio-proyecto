import bcrypt from "bcryptjs";
import { QueryTypes } from "sequelize";
import { pool, sequelize } from "../config/mariadb.js";

const requiredVariables = [
  "BOOTSTRAP_ADMIN_ENABLED",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_NAME",
  "BOOTSTRAP_ADMIN_DNI",
  "BOOTSTRAP_ADMIN_PASSWORD",
];

const createAdmin = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El bootstrap de administrador está deshabilitado en producción.");
  }

  const missingVariables = requiredVariables.filter((name) => !process.env[name]);
  if (missingVariables.length) {
    throw new Error(`Faltan variables requeridas: ${missingVariables.join(", ")}.`);
  }
  if (process.env.BOOTSTRAP_ADMIN_ENABLED !== "true") {
    throw new Error("BOOTSTRAP_ADMIN_ENABLED debe ser true para continuar.");
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  const nombre = process.env.BOOTSTRAP_ADMIN_NAME.trim();
  const dni = process.env.BOOTSTRAP_ADMIN_DNI.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL debe ser un email válido de hasta 100 caracteres.");
  }
  if (!nombre || nombre.length > 100) {
    throw new Error("BOOTSTRAP_ADMIN_NAME debe tener entre 1 y 100 caracteres.");
  }
  if (!dni || dni.length > 20) {
    throw new Error("BOOTSTRAP_ADMIN_DNI debe tener entre 1 y 20 caracteres.");
  }
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("La contraseña debe tener entre 12 caracteres y 72 bytes UTF-8.");
  }

  await sequelize.authenticate();

  const existingUsers = await sequelize.query(
    "SELECT id FROM users WHERE email = :email OR dni = :dni LIMIT 1",
    {
      replacements: { email, dni },
      type: QueryTypes.SELECT,
      logging: false,
    },
  );
  if (existingUsers.length) {
    throw new Error("Ya existe una cuenta con ese email o DNI; no se modificó ningún usuario.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await sequelize.query(
    `INSERT INTO users
       (id, nombre, email, password, dni, rol, isActive, mustChangePassword, acceso_habilitado)
     VALUES
       (UNHEX(REPLACE(UUID(), '-', '')), :nombre, :email, :password, :dni, 'admin', TRUE, FALSE, TRUE)`,
    {
      replacements: { nombre, email, password: passwordHash, dni },
      logging: false,
    },
  );
};

try {
  await createAdmin();
  console.log("Cuenta administradora creada. Ya puedes iniciar sesión.");
} catch (error) {
  console.error("No se pudo crear la cuenta administradora:", error.message);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
