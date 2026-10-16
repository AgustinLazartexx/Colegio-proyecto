module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_asistencia_general (
        id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        anio SMALLINT NOT NULL,
        division VARCHAR(10) NOT NULL,
        fecha DATE NOT NULL,
        estado ENUM('presente', 'ausente', 'tarde', 'justificado') NOT NULL,
        registrado_por BINARY(16) DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_asistencia_general_alumno_fecha (alumno_id, fecha),
        KEY idx_asistencia_general_curso_fecha (anio, division, fecha),
        CONSTRAINT fk_asistencia_general_alumno FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_asistencia_general_registrado_por FOREIGN KEY (registrado_por) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
