import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Sequelize } from "sequelize";
import { translatePostgresDdl, translatePostgresSql } from "./postgresCompat.js";

const require = createRequire(import.meta.url);

test("translates binary UUID helpers while preserving bind parameter names", () => {
  const sql = translatePostgresSql(
    "SELECT HEX(id) AS alumnoId FROM users WHERE id = UNHEX(:alumnoId) AND isActive = TRUE",
  );
  assert.equal(
    sql,
    'SELECT UPPER(encode(id, \'hex\')) AS "alumnoId" FROM users WHERE id = decode(:alumnoId, \'hex\') AND "isActive" = TRUE',
  );
});

test("translates UUID generation, time formatting, and PostgreSQL upsert clauses", () => {
  const sql = translatePostgresSql(
    "INSERT INTO school_asistencias (id, updatedAt) VALUES (UNHEX(REPLACE(UUID(), '-', '')), CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE estado = VALUES(estado), updatedAt = CURRENT_TIMESTAMP",
  );
  assert.match(sql, /decode\(replace\(gen_random_uuid\(\)::text, '-', ''\), 'hex'\)/);
  assert.match(sql, /ON CONFLICT \(clase_id, alumno_id, fecha\) DO UPDATE SET estado = EXCLUDED\.estado/);
  assert.match(sql, /"updatedAt"/);
  assert.equal(translatePostgresSql("SELECT TIME_FORMAT(horaInicio, '%H:%i') FROM clases"), "SELECT to_char(\"horaInicio\", 'HH24:MI') FROM clases");
});

test("translates ignored inserts into conflict-safe PostgreSQL inserts", () => {
  assert.equal(
    translatePostgresSql("INSERT IGNORE INTO clase_alumnos (clase_id, alumno_id) VALUES (:claseId, :alumnoId)"),
    "INSERT INTO clase_alumnos (clase_id, alumno_id) VALUES (:claseId, :alumnoId) ON CONFLICT DO NOTHING",
  );
});

test("translates MariaDB regular-expression predicates", () => {
  assert.equal(
    translatePostgresSql("SELECT id FROM users WHERE codigoAlumno REGEXP '^[0-9]+$'"),
    'SELECT id FROM users WHERE "codigoAlumno" ~ \'^[0-9]+$\'',
  );
});

test("translates MariaDB table definitions and retains secondary indexes", () => {
  const { sql, indexes } = translatePostgresDdl(`
    CREATE TABLE IF NOT EXISTS demo (
      id BINARY(16) NOT NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      nombre VARCHAR(100) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_demo_nombre (nombre),
      KEY idx_demo_created (createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  assert.match(sql, /id BYTEA NOT NULL/);
  assert.match(sql, /"isActive" BOOLEAN NOT NULL DEFAULT TRUE/);
  assert.match(sql, /"createdAt" TIMESTAMP NOT NULL/);
  assert.match(sql, /CONSTRAINT "uq_demo_nombre" UNIQUE \(nombre\)/);
  assert.doesNotMatch(sql, /,\s*\)$/);
  assert.doesNotMatch(sql, /ENGINE=|ON UPDATE CURRENT_TIMESTAMP|KEY idx_demo_created/);
  assert.deepEqual(indexes, [
    'CREATE INDEX IF NOT EXISTS idx_demo_created ON demo ("createdAt")',
    'CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql',
    'DROP TRIGGER IF EXISTS trg_demo_updated_at ON demo',
    'CREATE TRIGGER trg_demo_updated_at BEFORE UPDATE ON demo FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
  ]);
});

test("translates the production schema migrations without MariaDB-only DDL", async () => {
  const migrationFiles = [
    "../database/migrations/20261015-00-create-core-schema.cjs",
    "../database/migrations/20261015-12-add-user-auth-columns.cjs",
    "../database/migrations/20261015-13-create-academic-relations.cjs",
    "../database/migrations/20261015-14-create-relational-school-modules.cjs",
    "../database/migrations/20261015-15-create-general-attendance.cjs",
  ];
  const translations = [];
  const queryInterface = {
    sequelize: {
      query: async (sql) => {
        translations.push(translatePostgresDdl(sql));
      },
    },
    describeTable: async () => ({
      acceso_habilitado: {},
      resetPasswordToken: {},
      resetPasswordExpiresAt: {},
      descripcion: {},
      aula: {},
    }),
    showIndex: async () => [],
    addIndex: async () => {},
  };

  for (const file of migrationFiles) {
    await require(file).up(queryInterface, Sequelize);
  }

  assert.equal(translations.length, 14);
  for (const { sql, indexes } of translations) {
    assert.doesNotMatch(sql, /\bBINARY\s*\(|\bENUM\s*\(|\bTINYINT\b|\bDATETIME\b|ENGINE\s*=/i);
    assert.doesNotMatch(sql, /ON UPDATE CURRENT_TIMESTAMP/i);
    assert.doesNotMatch(sql, /,\s*\)$/);
    assert.ok(!indexes.some((index) => /\bKEY\s+\w+\s*\(/i.test(index)));
  }
});
