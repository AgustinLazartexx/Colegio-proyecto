module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();
    const binaryId = dialect === "postgres" ? "BYTEA" : "BINARY(16)";
    const integerSmall = dialect === "postgres" ? "SMALLINT" : "SMALLINT";

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS ciclos_lectivos (
        id ${binaryId} NOT NULL PRIMARY KEY,
        anio SMALLINT NOT NULL UNIQUE,
        nombre VARCHAR(100) NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_cierre DATE NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'PLANIFICADO'
          CHECK (estado IN ('PLANIFICADO', 'ACTIVO', 'RECUPERACION', 'CERRADO')),
        slot_activo ${integerSmall} DEFAULT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (fecha_cierre > fecha_inicio),
        CHECK (
          (estado IN ('ACTIVO', 'RECUPERACION') AND slot_activo = 1)
          OR (estado NOT IN ('ACTIVO', 'RECUPERACION') AND slot_activo IS NULL)
        )
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS inscripciones_ciclo (
        id ${binaryId} NOT NULL PRIMARY KEY,
        alumno_id ${binaryId} NOT NULL,
        ciclo_lectivo_id ${binaryId} NOT NULL,
        nivel ${integerSmall} NOT NULL CHECK (nivel BETWEEN 1 AND 6),
        division VARCHAR(10) NOT NULL,
        estado_academico VARCHAR(30) NOT NULL DEFAULT 'CURSANDO'
          CHECK (estado_academico IN ('CURSANDO', 'PROMOVIDO', 'PROMOVIDO_CON_PREVIAS',
            'REPITENTE', 'EGRESADO', 'EGRESADO_CON_PREVIAS', 'BAJA')),
        cantidad_desaprobadas SMALLINT NOT NULL DEFAULT 0 CHECK (cantidad_desaprobadas >= 0),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (alumno_id, ciclo_lectivo_id),
        FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE RESTRICT,
        FOREIGN KEY (ciclo_lectivo_id) REFERENCES ciclos_lectivos (id) ON DELETE RESTRICT
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS materias_previas (
        id ${binaryId} NOT NULL PRIMARY KEY,
        alumno_id ${binaryId} NOT NULL,
        materia_id ${binaryId} NOT NULL,
        ciclo_origen_id ${binaryId} NOT NULL,
        nivel_origen ${integerSmall} NOT NULL CHECK (nivel_origen BETWEEN 1 AND 6),
        nota_aprobacion DECIMAL(4,2) DEFAULT NULL,
        fecha_aprobacion DATE DEFAULT NULL,
        estado VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE'
          CHECK (estado IN ('PENDIENTE', 'APROBADA')),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (alumno_id, materia_id, ciclo_origen_id),
        FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE RESTRICT,
        FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE RESTRICT,
        FOREIGN KEY (ciclo_origen_id) REFERENCES ciclos_lectivos (id) ON DELETE RESTRICT,
        CHECK (
          (estado = 'PENDIENTE' AND nota_aprobacion IS NULL AND fecha_aprobacion IS NULL)
          OR (estado = 'APROBADA' AND nota_aprobacion >= 6 AND fecha_aprobacion IS NOT NULL)
        )
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_resultados_materia (
        id ${binaryId} NOT NULL PRIMARY KEY,
        ciclo_lectivo_id ${binaryId} NOT NULL,
        materia_id ${binaryId} NOT NULL,
        alumno_id ${binaryId} NOT NULL,
        trimestre1 DECIMAL(5,3) DEFAULT NULL,
        trimestre2 DECIMAL(5,3) DEFAULT NULL,
        trimestre3 DECIMAL(5,3) DEFAULT NULL,
        puntaje_final DECIMAL(6,3) DEFAULT NULL,
        nota_recuperacion DECIMAL(4,2) DEFAULT NULL,
        estado_materia VARCHAR(24) NOT NULL DEFAULT 'CURSANDO'
          CHECK (estado_materia IN ('CURSANDO', 'APROBADA', 'A_RECUPERACION',
            'APROBADA_RECUPERACION', 'DESAPROBADA')),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (ciclo_lectivo_id, materia_id, alumno_id),
        FOREIGN KEY (ciclo_lectivo_id) REFERENCES ciclos_lectivos (id) ON DELETE RESTRICT,
        FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE RESTRICT,
        FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE RESTRICT,
        CHECK (trimestre1 IS NULL OR trimestre1 BETWEEN 1 AND 10),
        CHECK (trimestre2 IS NULL OR trimestre2 BETWEEN 1 AND 10),
        CHECK (trimestre3 IS NULL OR trimestre3 BETWEEN 1 AND 10),
        CHECK (nota_recuperacion IS NULL OR nota_recuperacion BETWEEN 1 AND 10)
      );
    `);

    const cycleColumnTables = [
      "clases",
      "school_notas_trimestrales",
      "school_calificaciones",
      "school_tareas",
      "school_asistencia_general",
      "school_cuotas",
    ];

    for (const table of cycleColumnTables) {
      const columns = await queryInterface.describeTable(table);
      if (!columns.ciclo_lectivo_id) {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${table} ADD COLUMN ciclo_lectivo_id ${binaryId} NULL REFERENCES ciclos_lectivos (id) ON DELETE RESTRICT`,
        );
      }
      const indexes = await queryInterface.showIndex(table);
      const indexName = `idx_${table}_ciclo`;
      if (!indexes.some((index) => index.name === indexName)) {
        await queryInterface.addIndex(table, ["ciclo_lectivo_id"], { name: indexName });
      }
    }

    const classes = await queryInterface.describeTable("clases");
    if (!classes.nivel) {
      await queryInterface.addColumn("clases", "nivel", {
        type: Sequelize.SMALLINT,
        allowNull: true,
        validate: { min: 1, max: 6 },
      });
    }
    await queryInterface.sequelize.query(
      "UPDATE clases SET nivel = anio WHERE nivel IS NULL AND anio BETWEEN 1 AND 6",
    );

    const classIndexes = await queryInterface.showIndex("clases");
    if (!classIndexes.some((index) => index.name === "idx_clases_materia")) {
      await queryInterface.addIndex("clases", ["materia_id"], { name: "idx_clases_materia" });
    }
    if (classIndexes.some((index) => index.name === "uq_clase_materia_horario")) {
      await queryInterface.removeIndex("clases", "uq_clase_materia_horario");
    }
    const refreshedClassIndexes = await queryInterface.showIndex("clases");
    if (!refreshedClassIndexes.some((index) => index.name === "uq_clase_ciclo_materia_horario")) {
      await queryInterface.addIndex(
        "clases",
        ["ciclo_lectivo_id", "materia_id", "diaSemana", "horaInicio", "nivel", "division"],
        { name: "uq_clase_ciclo_materia_horario", unique: true },
      );
    }

    const gradeIndexes = await queryInterface.showIndex("school_notas_trimestrales");
    if (!gradeIndexes.some((index) => index.name === "idx_school_notas_trimestrales_materia")) {
      await queryInterface.addIndex(
        "school_notas_trimestrales",
        ["materia_id"],
        { name: "idx_school_notas_trimestrales_materia" },
      );
    }
    if (gradeIndexes.some((index) => index.name === "uq_nota_trimestral_materia_alumno")) {
      await queryInterface.removeIndex("school_notas_trimestrales", "uq_nota_trimestral_materia_alumno");
    }
    const refreshedGradeIndexes = await queryInterface.showIndex("school_notas_trimestrales");
    if (!refreshedGradeIndexes.some((index) => index.name === "uq_nota_trimestral_ciclo_materia_alumno")) {
      await queryInterface.addIndex(
        "school_notas_trimestrales",
        ["ciclo_lectivo_id", "materia_id", "alumno_id", "trimestre"],
        { name: "uq_nota_trimestral_ciclo_materia_alumno", unique: true },
      );
    }
  },
};
