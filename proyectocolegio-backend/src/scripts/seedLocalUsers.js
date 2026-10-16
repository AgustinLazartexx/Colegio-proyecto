import bcrypt from "bcryptjs";
import { QueryTypes } from "sequelize";
import { pool, sequelize } from "../config/mariadb.js";

const testUsers = [
  {
    nombre: "Alumno Prueba Uno",
    email: "alumno1@colegio.test",
    dni: "40000001",
    rol: "alumno",
    codigoAlumno: "9001",
    anio: 1,
    division: "A",
  },
  {
    nombre: "Alumno Prueba Dos",
    email: "alumno2@colegio.test",
    dni: "40000002",
    rol: "alumno",
    codigoAlumno: "9002",
    anio: 2,
    division: "B",
  },
  {
    nombre: "Profesor Prueba Uno",
    email: "profesor1@colegio.test",
    dni: "50000001",
    rol: "profesor",
  },
  {
    nombre: "Profesor Prueba Dos",
    email: "profesor2@colegio.test",
    dni: "50000002",
    rol: "profesor",
  },
];

try {
  await sequelize.authenticate();

  for (const user of testUsers) {
    const [existing] = await sequelize.query(
      "SELECT id FROM users WHERE email = :email OR dni = :dni LIMIT 1",
      {
        replacements: { email: user.email, dni: user.dni },
        type: QueryTypes.SELECT,
      },
    );

    if (existing) {
      console.log(`Se omite ${user.email}: ya existe un usuario con ese email o DNI.`);
      continue;
    }

    const password = await bcrypt.hash(user.dni, 12);
    await sequelize.query(
      `INSERT INTO users
         (id, nombre, email, password, dni, rol, codigoAlumno, anio, division, isActive, mustChangePassword, acceso_habilitado)
       VALUES
         (UNHEX(REPLACE(UUID(), '-', '')), :nombre, :email, :password, :dni, :rol, :codigoAlumno,
          :anio, :division, TRUE, TRUE, TRUE)`,
      {
        replacements: {
          ...user,
          password,
          codigoAlumno: user.codigoAlumno ?? null,
          anio: user.anio ?? null,
          division: user.division ?? null,
        },
      },
    );
    console.log(`Creado ${user.rol}: ${user.email} (contraseña inicial: DNI ${user.dni}).`);
  }
} catch (error) {
  console.error("No se pudieron cargar los usuarios locales de prueba:", error);
  process.exitCode = 1;
} finally {
  await Promise.all([sequelize.close(), pool.end()]);
}
