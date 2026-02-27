const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

function createUptimeMonitor(options = {}) {
  const url = options.url;
  const fetchImpl = options.fetchImpl || global.fetch;
  const logger = options.logger || console;
  const setIntervalFn = options.setIntervalFn || setInterval;
  const clearIntervalFn = options.clearIntervalFn || clearInterval;
  const intervalMs = options.intervalMs || DEFAULT_INTERVAL_MS;
  const source = options.source || "apom-api";

  if (!url) {
    return {
      start: () => {},
      stop: () => {},
    };
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("UPTIME_PING_URL requires a fetch implementation");
  }

  let timer = null;

  async function sendHeartbeat() {
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source,
          status: "up",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        logger.error(
          JSON.stringify({
            level: "warn",
            event: "uptime_ping_failed",
            statusCode: response.status,
          })
        );
      }
    } catch (error) {
      logger.error(
        JSON.stringify({
          level: "warn",
          event: "uptime_ping_error",
          error: {
            message: error.message,
          },
        })
      );
    }
  }

  return {
    start() {
      if (timer) {
        return;
      }

      void sendHeartbeat();
      timer = setIntervalFn(() => {
        void sendHeartbeat();
      }, intervalMs);
    },
    stop() {
      if (!timer) {
        return;
      }

      clearIntervalFn(timer);
      timer = null;
    },
  };
}

module.exports = {
  createUptimeMonitor,
};
