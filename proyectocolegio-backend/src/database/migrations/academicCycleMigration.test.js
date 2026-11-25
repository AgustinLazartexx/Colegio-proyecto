import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const migration = require("./20261123-19-create-academic-cycles.cjs");

test("keeps foreign-key support indexes before replacing legacy unique indexes", async () => {
  const actions = [];
  const indexes = new Map([
    ["clases", [{ name: "uq_clase_materia_horario" }]],
    ["school_notas_trimestrales", [{ name: "uq_nota_trimestral_materia_alumno" }]],
  ]);
  const queryInterface = {
    sequelize: {
      getDialect: () => "mariadb",
      query: async () => {},
    },
    describeTable: async () => ({ ciclo_lectivo_id: {}, nivel: {} }),
    showIndex: async (table) => indexes.get(table) ?? [],
    addIndex: async (table, fields, options) => {
      actions.push({ operation: "add", table, name: options.name, fields });
      indexes.set(table, [...(indexes.get(table) ?? []), { name: options.name }]);
    },
    removeIndex: async (table, name) => {
      actions.push({ operation: "remove", table, name });
      indexes.set(table, (indexes.get(table) ?? []).filter((index) => index.name !== name));
    },
  };

  await migration.up(queryInterface, {});

  const position = (operation, table, name) =>
    actions.findIndex((action) => action.operation === operation && action.table === table && action.name === name);

  assert.ok(
    position("add", "clases", "idx_clases_materia")
      < position("remove", "clases", "uq_clase_materia_horario"),
  );
  assert.ok(
    position("add", "school_notas_trimestrales", "idx_school_notas_trimestrales_materia")
      < position("remove", "school_notas_trimestrales", "uq_nota_trimestral_materia_alumno"),
  );
});

test("drops legacy unique constraints before indexes on PostgreSQL", async () => {
  const queries = [];
  const queryInterface = {
    sequelize: {
      getDialect: () => "postgres",
      query: async (sql) => {
        queries.push(sql);
      },
    },
    describeTable: async () => ({ ciclo_lectivo_id: {}, nivel: {} }),
    showIndex: async (table) => {
      if (table === "clases") return [{ name: "uq_clase_materia_horario" }];
      if (table === "school_notas_trimestrales") return [{ name: "uq_nota_trimestral_materia_alumno" }];
      return [];
    },
    addIndex: async () => {},
    removeIndex: async () => {
      throw new Error("removeIndex must not be called for unique constraints on postgres");
    },
  };

  await migration.up(queryInterface, {});

  assert.ok(queries.some((sql) => sql.includes('ALTER TABLE clases DROP CONSTRAINT IF EXISTS "uq_clase_materia_horario"')));
  assert.ok(queries.some((sql) => sql.includes('ALTER TABLE school_notas_trimestrales DROP CONSTRAINT IF EXISTS "uq_nota_trimestral_materia_alumno"')));
});
