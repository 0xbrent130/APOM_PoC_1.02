const { promisify } = require("node:util");
const { execFile } = require("node:child_process");
const { getPrismaClient, resolvePrismaSchemaPath } = require("./prismaClient.js");

const execFileAsync = promisify(execFile);

async function deployPrismaMigrations(run = execFileAsync) {
  const schemaPath = resolvePrismaSchemaPath();

  try {
    await run(
      "npx",
      ["prisma", "migrate", "deploy", "--schema", schemaPath],
      {
        env: process.env,
      }
    );
  } catch (error) {
    const details = (error && (error.stderr || error.stdout || error.message)) || "unknown prisma migrate error";
    throw new Error(`Prisma migrate deploy failed: ${details}`);
  }
}

async function bootstrapPrisma() {
  await deployPrismaMigrations();
  const prisma = getPrismaClient();
  await prisma.$connect();
}

module.exports = {
  bootstrapPrisma,
  deployPrismaMigrations,
};
