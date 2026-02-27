const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

let prismaInstance;

function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    const error = new Error("DATABASE_URL is required for Prisma client");
    error.code = "DATABASE_URL_MISSING";
    throw error;
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
  }

  return prismaInstance;
}

function resolvePrismaSchemaPath() {
  return path.resolve(__dirname, "../prisma/schema.prisma");
}

module.exports = { createPrismaClient, getPrismaClient, resolvePrismaSchemaPath };
