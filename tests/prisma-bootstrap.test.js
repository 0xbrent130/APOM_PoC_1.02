const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const { deployPrismaMigrations } = require("../server/prismaBootstrap.js");
const { startServer } = require("../server/app.js");
const execFileAsync = promisify(execFile);

test("prisma deploy failure returns explicit startup error", async () => {
  const failingRunner = async () => {
    const error = new Error("Process failed");
    error.stderr = "SQL error near INVALID";
    throw error;
  };

  await assert.rejects(
    deployPrismaMigrations(failingRunner),
    /Prisma migrate deploy failed: SQL error near INVALID/
  );
});

test("startup aborts before listen when migrations fail", async () => {
  let listened = false;
  const fakeApp = {
    listen: () => {
      listened = true;
      throw new Error("should not listen");
    },
  };

  const failingBootstrap = async () => {
    throw new Error("Prisma migrate deploy failed: syntax error");
  };

  await assert.rejects(
    startServer({ app: fakeApp, bootstrap: failingBootstrap, port: 9999 }),
    /Prisma migrate deploy failed: syntax error/
  );
  assert.equal(listened, false);
});

test("invalid migration SQL aborts prisma deploy with explicit error", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apom-prisma-invalid-"));
  const schemaPath = path.join(tempRoot, "schema.prisma");
  const migrationsDir = path.join(tempRoot, "migrations", "0001_invalid");
  const migrationSqlPath = path.join(migrationsDir, "migration.sql");
  const lockPath = path.join(tempRoot, "migrations", "migration_lock.toml");

  await fs.mkdir(migrationsDir, { recursive: true });
  await fs.writeFile(
    schemaPath,
    [
      "generator client {",
      "  provider = \"prisma-client-js\"",
      "}",
      "",
      "datasource db {",
      "  provider = \"sqlite\"",
      "  url      = env(\"DATABASE_URL\")",
      "}",
      "",
      "model User {",
      "  id String @id",
      "}",
      "",
    ].join("\n")
  );
  await fs.writeFile(lockPath, 'provider = "sqlite"\n');
  await fs.writeFile(migrationSqlPath, "THIS IS INVALID SQL;\n");

  const invalidDbUrl = `file:${path.join(tempRoot, "invalid.db")}`;

  await assert.rejects(
    execFileAsync("npx", ["prisma", "migrate", "deploy", "--schema", schemaPath], {
      env: { ...process.env, DATABASE_URL: invalidDbUrl },
    }),
    (error) => {
      const output = `${error.stderr || ""}\n${error.stdout || ""}`;
      return output.includes("Error:") || output.includes("P3018");
    }
  );
});
