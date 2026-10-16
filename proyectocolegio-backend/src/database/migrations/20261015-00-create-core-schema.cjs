module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BINARY(16) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        dni VARCHAR(20) NOT NULL,
        rol ENUM('admin', 'profesor', 'alumno') NOT NULL DEFAULT 'alumno',
        codigoAlumno VARCHAR(50) DEFAULT NULL,
        anio INT DEFAULT NULL,
        division VARCHAR(10) DEFAULT NULL,
        isActive TINYINT(1) NOT NULL DEFAULT 1,
        mustChangePassword TINYINT(1) NOT NULL DEFAULT 1,
        acceso_habilitado TINYINT(1) NOT NULL DEFAULT 1,
        resetPasswordToken VARCHAR(64) DEFAULT NULL,
        resetPasswordExpiresAt DATETIME DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email),
        UNIQUE KEY uq_users_dni (dni),
        UNIQUE KEY uq_users_codigo_alumno (codigoAlumno),
        KEY idx_users_role_course (rol, anio, division)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS materias (
        id BINARY(16) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT DEFAULT NULL,
        anio INT NOT NULL,
        division VARCHAR(10) DEFAULT NULL,
        profesor_id BINARY(16) DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_materia_curso (nombre, anio, division),
        KEY idx_materias_profesor (profesor_id),
        CONSTRAINT fk_materias_profesor
          FOREIGN KEY (profesor_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS clases (
        id BINARY(16) NOT NULL,
        materia_id BINARY(16) NOT NULL,
        diaSemana VARCHAR(15) NOT NULL,
        horaInicio TIME NOT NULL,
        horaFin TIME NOT NULL,
        duracion INT DEFAULT NULL,
        aula VARCHAR(50) DEFAULT NULL,
        anio INT NOT NULL,
        division VARCHAR(10) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_clase_materia_horario (materia_id, diaSemana, horaInicio, anio, division),
        KEY idx_clases_curso_horario (anio, division, diaSemana, horaInicio),
        CONSTRAINT fk_clases_materia
          FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
