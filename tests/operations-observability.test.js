const test = require("node:test");
const assert = require("node:assert/strict");

const { createApp } = require("../server/app.js");
const { createUptimeMonitor } = require("../server/uptimeMonitor.js");

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

function parseLogLine(line) {
  return JSON.parse(line);
}

test("request middleware emits structured JSON logs", async () => {
  const records = [];
  const logger = {
    log: (line) => records.push(parseLogLine(line)),
  };
  const app = createApp({
    logger,
    readinessCheck: async () => {},
  });

  await withServer(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health/live`);
    assert.equal(response.status, 200);
  });

  const requestRecord = records.find((entry) => entry.event === "http_request");
  assert.ok(requestRecord);
  assert.equal(requestRecord.method, "GET");
  assert.equal(requestRecord.route, "/health/live");
  assert.equal(requestRecord.statusCode, 200);
  assert.equal(typeof requestRecord.durationMs, "number");
});

test("uptime monitor sends heartbeat and can stop interval", async () => {
  const pingCalls = [];
  let scheduledTask = null;
  let clearedHandle = null;

  const uptimeMonitor = createUptimeMonitor({
    url: "https://monitor.example/ping",
    source: "apom-api",
    fetchImpl: async (...args) => {
      pingCalls.push(args);
      return { ok: true, status: 200 };
    },
    setIntervalFn: (task) => {
      scheduledTask = task;
      return "timer-1";
    },
    clearIntervalFn: (handle) => {
      clearedHandle = handle;
    },
  });

  uptimeMonitor.start();
  assert.equal(typeof scheduledTask, "function");
  await scheduledTask();
  uptimeMonitor.stop();

  assert.equal(clearedHandle, "timer-1");
  assert.ok(pingCalls.length >= 2);
  const [url, options] = pingCalls[0];
  assert.equal(url, "https://monitor.example/ping");
  assert.equal(options.method, "POST");
  assert.equal(options.headers["content-type"], "application/json");
});
