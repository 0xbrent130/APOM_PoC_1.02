const { promisify } = require("node:util");
const { execFile } = require("node:child_process");
const { prisma, resolvePrismaSchemaPath } = require("./prismaClient.js");

const execFileAsync = promisify(execFile);

async function deployPrismaMigrations(run = execFileAsync) {
  const schemaPath = resolvePrismaSchemaPath();

  try {
    await run(
      "npx",
      ["prisma", "migrate", "deploy", "--schema", schemaPath],
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
        },
      }
    );
  } catch (error) {
    const details = (error && (error.stderr || error.stdout || error.message)) || "unknown prisma migrate error";
    throw new Error(`Prisma migrate deploy failed: ${details}`);
  }
}

async function bootstrapPrisma() {
  await deployPrismaMigrations();
  await prisma.$connect();
}

module.exports = {
  bootstrapPrisma,
  deployPrismaMigrations,
};
