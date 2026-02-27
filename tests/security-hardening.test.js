const test = require("node:test");
const assert = require("node:assert/strict");

const { createApp } = require("../server/app.js");

async function withServer(app, run) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    await run(server);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

test("repeated abusive requests are rate-limited with 429", async () => {
  const app = createApp({
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || "file:./test.db",
      CORS_ORIGINS: "http://localhost:3000",
      RATE_LIMIT_MAX: "2",
      RATE_LIMIT_WINDOW_MS: "60000",
    },
    readinessCheck: async () => {},
  });

  await withServer(app, async (server) => {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/contact`;

    const first = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "hello" }),
    });
    const second = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "hello again" }),
    });
    const third = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "abuse" }),
    });

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);
  });
});

test("disallowed origin is blocked and receives no sensitive data", async () => {
  const app = createApp({
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || "file:./test.db",
      CORS_ORIGINS: "https://allowed.example",
      RATE_LIMIT_MAX: "10",
      RATE_LIMIT_WINDOW_MS: "60000",
    },
    readinessCheck: async () => {},
  });

  await withServer(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/contact`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://blocked.example",
      },
      body: JSON.stringify({
        message: "secret message",
        token: "top-secret-token",
      }),
    });

    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.code, "CORS_ORIGIN_BLOCKED");
    assert.equal(body.token, undefined);
  });
});
