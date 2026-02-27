const { z } = require("zod");

const runtimeEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .optional()
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).optional().default(8000),
  CORS_ORIGINS: z.string().optional().default(""),
  REQUEST_BODY_LIMIT: z.string().optional().default("100kb"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).optional().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).optional().default(100),
});

const securityEnvSchema = runtimeEnvSchema.omit({
  DATABASE_URL: true,
});

class ConfigValidationError extends Error {
  constructor(issues) {
    super("Invalid runtime configuration");
    this.name = "ConfigValidationError";
    this.code = "CONFIG_VALIDATION_ERROR";
    this.details = issues;
  }
}

function parseWithSchema(schema, env = process.env) {
  const parsed = schema.safeParse(env);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new ConfigValidationError(details);
  }

  return parsed.data;
}

function getRuntimeConfig(env = process.env) {
  return parseWithSchema(runtimeEnvSchema, env);
}

function getSecurityRuntimeConfig(env = process.env) {
  return parseWithSchema(securityEnvSchema, env);
}

module.exports = {
  ConfigValidationError,
  getRuntimeConfig,
  getSecurityRuntimeConfig,
};
