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
    'SELECT UPPER(encode(id, \'hex\')) AS "alumnoId" FROM users WHERE id = decode(replace(:alumnoId, \'-\', \'\'), \'hex\') AND "isActive" = TRUE',
  );
});

test("accepts UUID parameters with or without hyphens", () => {
  assert.equal(
    translatePostgresSql("SELECT UNHEX(:taskId)"),
    "SELECT decode(replace(:taskId, '-', ''), 'hex')",
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

test("translates GROUP_CONCAT, null-safe equality, and backticks for PostgreSQL", () => {
  assert.equal(
    translatePostgresSql(
      "SELECT GROUP_CONCAT(DISTINCT p.nombre ORDER BY p.nombre SEPARATOR ', ') FROM users p",
    ),
    "SELECT STRING_AGG(DISTINCT p.nombre, ', ' ORDER BY p.nombre) FROM users p",
  );
  assert.equal(
    translatePostgresSql("SELECT id FROM materias WHERE division <=> :division"),
    "SELECT id FROM materias WHERE division IS NOT DISTINCT FROM :division",
  );
  assert.equal(
    translatePostgresSql("UPDATE users SET `isActive` = :isActive WHERE id = UNHEX(:id)"),
    'UPDATE users SET "isActive" = :isActive WHERE id = decode(replace(:id, \'-\', \'\'), \'hex\')',
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

test("adds fields required by academic controllers to legacy tables", async () => {
  const addedColumns = [];
  const migration = require("../database/migrations/20261015-13-create-academic-relations.cjs");
  const tables = {
    users: {},
    materias: { nombre: {}, anio: {}, profesor_id: {} },
    clases: { aula: {} },
  };
  const queryInterface = {
    sequelize: { query: async () => {} },
    describeTable: async (table) => tables[table],
    addColumn: async (table, column) => addedColumns.push(`${table}.${column}`),
    showIndex: async () => [
      { name: "uq_materia_curso" },
      { name: "uq_clase_materia_horario" },
    ],
  };

  await migration.up(queryInterface, Sequelize);

  assert.deepEqual(addedColumns, [
    "users.codigoAlumno",
    "materias.descripcion",
    "materias.division",
    "materias.isActive",
    "clases.isActive",
  ]);
});

test("adds mustChangePassword to existing user tables", async () => {
  const addedColumns = [];
  const migration = require("../database/migrations/20261015-12-add-user-auth-columns.cjs");
  const queryInterface = {
    describeTable: async () => ({}),
    addColumn: async (_table, column) => addedColumns.push(column),
  };

  await migration.up(queryInterface, Sequelize);

  assert.ok(addedColumns.includes("mustChangePassword"));
});

test("adds active status to class enrollments idempotently", async () => {
  const migration = require("../database/migrations/20261021-18-add-active-status-to-class-enrollments.cjs");
  let hasIsActive = false;
  let addedColumn;
  const queryInterface = {
    describeTable: async () => (hasIsActive ? { isActive: {} } : {}),
    addColumn: async (table, column, options) => {
      hasIsActive = true;
      addedColumn = { table, column, options };
    },
  };

  await migration.up(queryInterface, Sequelize);
  await migration.up(queryInterface, Sequelize);

  assert.equal(addedColumn.table, "clase_alumnos");
  assert.equal(addedColumn.column, "isActive");
  assert.equal(addedColumn.options.allowNull, false);
  assert.equal(addedColumn.options.defaultValue, true);
});

test("translates the production schema migrations without MariaDB-only DDL", async () => {
  const migrationFiles = [
    "../database/migrations/20261015-00-create-core-schema.cjs",
    "../database/migrations/20261015-12-add-user-auth-columns.cjs",
    "../database/migrations/20261015-13-create-academic-relations.cjs",
    "../database/migrations/20261015-14-create-relational-school-modules.cjs",
    "../database/migrations/20261015-15-create-general-attendance.cjs",
    "../database/migrations/20261021-18-add-active-status-to-class-enrollments.cjs",
    "../database/migrations/20261123-19-create-academic-cycles.cjs",
  ];
  const translations = [];
  const queryInterface = {
    sequelize: {
      query: async (sql) => {
        translations.push(translatePostgresDdl(sql));
      },
      getDialect: () => "postgres",
    },
    describeTable: async () => ({
      mustChangePassword: {},
      codigoAlumno: {},
      acceso_habilitado: {},
      resetPasswordToken: {},
      resetPasswordExpiresAt: {},
      descripcion: {},
      division: {},
      isActive: {},
      aula: {},
    }),
    showIndex: async () => [],
    addIndex: async () => {},
    addColumn: async () => {},
    removeIndex: async () => {},
  };

  for (const file of migrationFiles) {
    await require(file).up(queryInterface, Sequelize);
  }

  assert.equal(translations.length, 25);
  for (const { sql, indexes } of translations) {
    assert.doesNotMatch(sql, /\bBINARY\s*\(|\bENUM\s*\(|\bTINYINT\b|\bDATETIME\b|ENGINE\s*=/i);
    assert.doesNotMatch(sql, /ON UPDATE CURRENT_TIMESTAMP/i);
    assert.doesNotMatch(sql, /,\s*\)$/);
    assert.ok(!indexes.some((index) => /\bKEY\s+\w+\s*\(/i.test(index)));
  }
});
