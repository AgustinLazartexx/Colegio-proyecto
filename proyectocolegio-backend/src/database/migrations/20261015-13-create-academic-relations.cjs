module.exports = {
  up: async (queryInterface, Sequelize) => {
    const materias = await queryInterface.describeTable("materias");
    if (!materias.descripcion) {
      await queryInterface.addColumn("materias", "descripcion", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    const clases = await queryInterface.describeTable("clases");
    if (!clases.aula) {
      await queryInterface.addColumn("clases", "aula", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS clase_profesores (
        clase_id BINARY(16) NOT NULL,
        profesor_id BINARY(16) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (clase_id, profesor_id),
        KEY idx_clase_profesores_profesor (profesor_id),
        CONSTRAINT fk_clase_profesores_clase
          FOREIGN KEY (clase_id) REFERENCES clases (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_clase_profesores_profesor
          FOREIGN KEY (profesor_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS clase_alumnos (
        clase_id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (clase_id, alumno_id),
        KEY idx_clase_alumnos_alumno (alumno_id),
        CONSTRAINT fk_clase_alumnos_clase
          FOREIGN KEY (clase_id) REFERENCES clases (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_clase_alumnos_alumno
          FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const materiaIndexes = await queryInterface.showIndex("materias");
    if (!materiaIndexes.some((index) => index.name === "uq_materia_curso")) {
      await queryInterface.addIndex(
        "materias",
        ["nombre", "anio", "division"],
        { name: "uq_materia_curso", unique: true },
      );
    }

    const classIndexes = await queryInterface.showIndex("clases");
    if (!classIndexes.some((index) => index.name === "uq_clase_materia_horario")) {
      await queryInterface.addIndex(
        "clases",
        ["materia_id", "diaSemana", "horaInicio", "anio", "division"],
        { name: "uq_clase_materia_horario", unique: true },
      );
    }
  },
};
