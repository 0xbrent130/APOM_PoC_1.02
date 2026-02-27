const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

function resolvePrismaSchemaPath() {
  return path.resolve(__dirname, "../prisma/schema.prisma");
}

module.exports = { prisma, resolvePrismaSchemaPath };
