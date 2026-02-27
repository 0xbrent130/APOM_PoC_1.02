import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: {
    command:
      "VITE_API_BASE_URL=/api VITE_E2E_SKIP_WALLET_CHECK=1 npm run dev-front -- --host 127.0.0.1 --port 4173",
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
