import test, { after } from "node:test";
import assert from "node:assert/strict";
import pool, { sequelize } from "../config/mariadb.js";
import { databaseId } from "./academicData.service.js";

after(async () => {
  await sequelize.close();
  await pool.end();
});

test("normalizes UUID strings and binary database IDs to the same hexadecimal form", () => {
  const expected = "70F95E11C8B811F19F2688A4C2498C18";
  const binaryId = Buffer.from(expected, "hex");

  assert.equal(databaseId(expected), expected);
  assert.equal(databaseId("70f95e11-c8b8-11f1-9f26-88a4c2498c18"), expected);
  assert.equal(databaseId(binaryId), expected);
});
