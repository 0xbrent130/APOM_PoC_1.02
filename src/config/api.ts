export type ApiEnvironment = "development" | "staging" | "production";

interface ApiEnvSource {
  MODE?: string;
  VITE_APP_ENV?: string;
  VITE_API_BASE_URL?: string;
  VITE_API_BASE_URL_DEV?: string;
  VITE_API_BASE_URL_STAGING?: string;
  VITE_API_BASE_URL_PROD?: string;
}

const DEFAULT_BASE_URLS: Record<ApiEnvironment, string> = {
  development: "http://localhost:8000/api",
  staging: "/api",
  production: "/api",
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function inferEnvironment(mode: string | undefined) {
  if (mode === "production") {
    return "production";
  }

  if (mode === "staging") {
    return "staging";
  }

  return "development";
}

export function resolveApiEnvironment(env: ApiEnvSource): ApiEnvironment {
  const explicit = env.VITE_APP_ENV?.trim().toLowerCase();

  if (explicit === "production" || explicit === "staging" || explicit === "development") {
    return explicit;
  }

  return inferEnvironment(env.MODE);
}

export function resolveApiBaseUrl(env: ApiEnvSource): string {
  const explicitBaseUrl = env.VITE_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return normalizeBaseUrl(explicitBaseUrl);
  }

  const environment = resolveApiEnvironment(env);

  const byEnvironment =
    environment === "production"
      ? env.VITE_API_BASE_URL_PROD
      : environment === "staging"
        ? env.VITE_API_BASE_URL_STAGING
        : env.VITE_API_BASE_URL_DEV;

  if (byEnvironment?.trim()) {
    return normalizeBaseUrl(byEnvironment.trim());
  }

  return DEFAULT_BASE_URLS[environment];
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env);
