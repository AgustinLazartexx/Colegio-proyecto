module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_asistencias (
        id BINARY(16) NOT NULL,
        clase_id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        fecha DATE NOT NULL,
        estado ENUM('presente', 'ausente', 'tarde', 'justificado') NOT NULL,
        cargado_por BINARY(16) DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_asistencia_clase_alumno_fecha (clase_id, alumno_id, fecha),
        KEY idx_asistencia_alumno_fecha (alumno_id, fecha),
        CONSTRAINT fk_asistencia_clase FOREIGN KEY (clase_id) REFERENCES clases (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_asistencia_alumno FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_asistencia_cargado_por FOREIGN KEY (cargado_por) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_calificaciones (
        id BINARY(16) NOT NULL,
        materia_id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        profesor_id BINARY(16) NOT NULL,
        descripcion VARCHAR(255) NOT NULL,
        nota DECIMAL(4,2) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_calificacion_alumno (alumno_id, createdAt),
        KEY idx_calificacion_materia (materia_id, createdAt),
        CONSTRAINT fk_calificacion_materia FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_calificacion_alumno FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_calificacion_profesor FOREIGN KEY (profesor_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_notas_trimestrales (
        id BINARY(16) NOT NULL,
        materia_id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        trimestre TINYINT NOT NULL,
        orientadora DECIMAL(4,2) DEFAULT NULL,
        proceso DECIMAL(4,2) DEFAULT NULL,
        integradora DECIMAL(4,2) DEFAULT NULL,
        recuperacion DECIMAL(4,2) DEFAULT NULL,
        promedio_ponderado DECIMAL(5,3) DEFAULT NULL,
        nota_final_trimestre DECIMAL(5,3) DEFAULT NULL,
        observacion TEXT DEFAULT NULL,
        is_aprobada_admin TINYINT(1) NOT NULL DEFAULT 0,
        is_bloqueada TINYINT(1) NOT NULL DEFAULT 0,
        actualizado_por BINARY(16) DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_nota_trimestral_materia_alumno (materia_id, alumno_id, trimestre),
        KEY idx_nota_trimestral_alumno (alumno_id, trimestre),
        CONSTRAINT fk_nota_trimestral_materia FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_nota_trimestral_alumno FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_nota_trimestral_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT chk_nota_trimestral_trimestre CHECK (trimestre BETWEEN 1 AND 3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_auditoria_notas (
        id BINARY(16) NOT NULL,
        nota_id BINARY(16) NOT NULL,
        materia_id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        trimestre TINYINT NOT NULL,
        campo_modificado VARCHAR(30) NOT NULL,
        valor_anterior VARCHAR(30) DEFAULT NULL,
        valor_nuevo VARCHAR(30) DEFAULT NULL,
        modificado_por BINARY(16) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_auditoria_materia_fecha (materia_id, createdAt),
        KEY idx_auditoria_nota_fecha (nota_id, createdAt),
        CONSTRAINT fk_auditoria_nota FOREIGN KEY (nota_id) REFERENCES school_notas_trimestrales (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_auditoria_materia FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_auditoria_alumno FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_auditoria_usuario FOREIGN KEY (modificado_por) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_tareas (
        id BINARY(16) NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT DEFAULT NULL,
        fecha_entrega DATETIME NOT NULL,
        materia_id BINARY(16) NOT NULL,
        profesor_id BINARY(16) NOT NULL,
        archivo VARCHAR(255) DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tarea_materia_fecha (materia_id, fecha_entrega),
        KEY idx_tarea_profesor_fecha (profesor_id, createdAt),
        CONSTRAINT fk_tarea_materia FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_tarea_profesor FOREIGN KEY (profesor_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_entregas (
        id BINARY(16) NOT NULL,
        tarea_id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        archivo VARCHAR(255) NOT NULL,
        fecha_entrega DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        nota DECIMAL(4,2) DEFAULT NULL,
        comentario TEXT DEFAULT NULL,
        fecha_correccion DATETIME DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_entrega_tarea_alumno (tarea_id, alumno_id),
        KEY idx_entrega_alumno_fecha (alumno_id, fecha_entrega),
        CONSTRAINT fk_entrega_tarea FOREIGN KEY (tarea_id) REFERENCES school_tareas (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_entrega_alumno FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_anuncios (
        id BINARY(16) NOT NULL,
        profesor_id BINARY(16) NOT NULL,
        materia_id BINARY(16) NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        mensaje TEXT NOT NULL,
        fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_anuncio_materia_fecha (materia_id, fecha),
        KEY idx_anuncio_profesor_fecha (profesor_id, fecha),
        CONSTRAINT fk_anuncio_profesor FOREIGN KEY (profesor_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_anuncio_materia FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS school_cuotas (
        id BINARY(16) NOT NULL,
        alumno_id BINARY(16) NOT NULL,
        mes TINYINT NOT NULL,
        anio SMALLINT NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        estado ENUM('pendiente', 'pagado', 'vencido') NOT NULL DEFAULT 'pendiente',
        fecha_vencimiento DATE NOT NULL,
        fecha_pago DATETIME DEFAULT NULL,
        metodo_pago ENUM('efectivo', 'transferencia', 'tarjeta') DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cuota_alumno_periodo (alumno_id, mes, anio),
        KEY idx_cuota_estado_vencimiento (estado, fecha_vencimiento),
        CONSTRAINT fk_cuota_alumno FOREIGN KEY (alumno_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT chk_cuota_mes CHECK (mes BETWEEN 1 AND 12),
        CONSTRAINT chk_cuota_monto CHECK (monto >= 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
