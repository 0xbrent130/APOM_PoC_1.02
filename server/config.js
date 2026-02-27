const { z } = require("zod");

const runtimeEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .optional()
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).optional().default(8000),
});

class ConfigValidationError extends Error {
  constructor(issues) {
    super("Invalid runtime configuration");
    this.name = "ConfigValidationError";
    this.code = "CONFIG_VALIDATION_ERROR";
    this.details = issues;
  }
}

function getRuntimeConfig(env = process.env) {
  const parsed = runtimeEnvSchema.safeParse(env);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new ConfigValidationError(details);
  }

  return parsed.data;
}

module.exports = {
  ConfigValidationError,
  getRuntimeConfig,
};
