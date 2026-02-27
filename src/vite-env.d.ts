/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: "development" | "staging" | "production";
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL_DEV?: string;
  readonly VITE_API_BASE_URL_STAGING?: string;
  readonly VITE_API_BASE_URL_PROD?: string;
  readonly VITE_DEV_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
