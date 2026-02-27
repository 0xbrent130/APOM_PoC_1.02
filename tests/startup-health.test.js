const test = require("node:test");
const assert = require("node:assert/strict");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const { createApp } = require("../server/app.js");

const execFileAsync = promisify(execFile);

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

test("health/live returns 200 and status live", async () => {
  const app = createApp({ readinessCheck: async () => {} });

  await withServer(app, async (server) => {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health/live`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "live" });
  });
});

test("health/ready returns 200 and status ready when db is ready", async () => {
  const app = createApp({ readinessCheck: async () => {} });

  await withServer(app, async (server) => {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health/ready`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ready" });
  });
});

test("health/ready returns 503 when db readiness check fails", async () => {
  const app = createApp({
    readinessCheck: async () => {
      throw new Error("db unavailable");
    },
  });

  await withServer(app, async (server) => {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health/ready`);
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.deepEqual(body, { status: "not_ready" });
  });
});

test("missing DATABASE_URL exits non-zero with structured startup log", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, ["server/app.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: "",
        PORT: "18000",
      },
    }),
    (error) => {
      assert.notEqual(error.code, 0);
      const stderrLines = (error.stderr || "")
        .trim()
        .split("\n")
        .filter(Boolean);
      const lastLine = stderrLines[stderrLines.length - 1] || "";
      const parsed = JSON.parse(lastLine);

      assert.equal(parsed.level, "error");
      assert.equal(parsed.event, "startup_failure");
      assert.equal(parsed.error.code, "CONFIG_VALIDATION_ERROR");
      assert.ok(
        parsed.error.details.some(
          (detail) =>
            detail.path === "DATABASE_URL" &&
            detail.message === "DATABASE_URL is required"
        )
      );
      return true;
    }
  );
});
