const camelIdentifier = /\b[a-z][a-zA-Z0-9_]*[A-Z][a-zA-Z0-9_]*\b/g;

const quoteCamelCaseIdentifiers = (sql) =>
  sql.replace(/'(?:(?:'')|[^'])*'|:[a-zA-Z]\w*|"(?:[^"]|"")*"|[^'":]+/g, (part) => {
    if (part.startsWith("'") || part.startsWith(":") || part.startsWith('"')) return part;
    return part.replace(camelIdentifier, (identifier) => `"${identifier}"`);
  });

const translateMariaDbUpsert = (sql) => {
  const table = sql.match(/INSERT\s+INTO\s+([a-z_]+)/i)?.[1]?.toLowerCase();
  const conflictKeys = {
    school_asistencias: "(clase_id, alumno_id, fecha)",
    school_asistencia_general: "(alumno_id, fecha)",
  }[table];
  if (!conflictKeys || !/ON DUPLICATE KEY UPDATE/i.test(sql)) return sql;

  return sql
    .replace(/ON DUPLICATE KEY UPDATE/i, `ON CONFLICT ${conflictKeys} DO UPDATE SET`)
    .replace(/VALUES\(([a-z_]+)\)/gi, "EXCLUDED.$1");
};

export const translatePostgresSql = (input) => {
  let sql = String(input);

  sql = sql
    .replace(/UNHEX\s*\(\s*REPLACE\s*\(\s*UUID\s*\(\s*\)\s*,\s*'-'\s*,\s*''\s*\)\s*\)/gi,
      "decode(replace(gen_random_uuid()::text, '-', ''), 'hex')")
    .replace(/UNHEX\s*\(\s*(:[a-zA-Z]\w*)\s*\)/gi, "decode($1, 'hex')")
    .replace(/HEX\s*\(\s*([a-zA-Z_][\w.]*)\s*\)/gi, "UPPER(encode($1, 'hex'))")
    .replace(/TIME_FORMAT\s*\(\s*([^,]+),\s*'%H:%i'\s*\)/gi, "to_char($1, 'HH24:MI')")
    .replace(/\bIFNULL\s*\(/gi, "COALESCE(")
    .replace(/\bREGEXP\b/gi, "~");

  sql = translateMariaDbUpsert(sql);

  const ignoreInsert = /^\s*INSERT\s+IGNORE\s+INTO\b/i.test(sql);
  if (ignoreInsert) {
    sql = sql.replace(/^(\s*)INSERT\s+IGNORE\s+INTO\b/i, "$1INSERT INTO");
    sql = sql.replace(/;\s*$/, "");
    sql = `${sql} ON CONFLICT DO NOTHING`;
  }

  return quoteCamelCaseIdentifiers(sql);
};

export const translatePostgresDdl = (input) => {
  const sql = String(input);
  const match = sql.match(
    /^\s*(CREATE TABLE IF NOT EXISTS\s+[a-zA-Z_]\w*\s*\()([\s\S]*)(\)\s*ENGINE\s*=\s*InnoDB[\s\S]*?;?)\s*$/i,
  );
  if (!match) return { sql: translatePostgresSql(sql), indexes: [] };

  const [, prefix, rawBody] = match;
  const table = sql.match(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z_]\w*)/i)[1];
  const indexes = [];
  let body = rawBody.replace(
    /^\s*KEY\s+([a-zA-Z_]\w*)\s*\(([^)\r\n]+)\)\s*,?\s*$/gim,
    (_definition, name, columns) => {
      indexes.push(`CREATE INDEX IF NOT EXISTS ${name} ON ${table} (${columns})`);
      return "";
    },
  );
  const hasUpdatedAt = /\bupdatedAt\s+DATETIME\b/i.test(body);

  body = body
    .replace(/UNIQUE\s+KEY\s+([a-zA-Z_]\w*)\s*\(([^)]+)\)/gi, 'CONSTRAINT "$1" UNIQUE ($2)')
    .replace(/\bBINARY\s*\(\s*16\s*\)/gi, "BYTEA")
    .replace(/\bENUM\s*\([^)]*\)/gi, "VARCHAR(20)")
    .replace(/\bTINYINT\s*\(\s*1\s*\)/gi, "BOOLEAN")
    .replace(/\bTINYINT\b/gi, "SMALLINT")
    .replace(/\bDATETIME\b/gi, "TIMESTAMP")
    .replace(/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, "")
    .replace(/(\b[a-zA-Z_]\w*\s+BOOLEAN\b[^,\r\n]*\bDEFAULT)\s+1\b/gi, "$1 TRUE")
    .replace(/(\b[a-zA-Z_]\w*\s+BOOLEAN\b[^,\r\n]*\bDEFAULT)\s+0\b/gi, "$1 FALSE")
    .replace(/,\s*$/, "");

  const statement = `${prefix}${body})`;
  if (hasUpdatedAt) {
    indexes.push(
      `CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql`,
      `DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table}`,
      `CREATE TRIGGER trg_${table}_updated_at BEFORE UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
    );
  }

  return {
    sql: translatePostgresSql(statement),
    indexes: indexes.map(translatePostgresSql),
  };
};
