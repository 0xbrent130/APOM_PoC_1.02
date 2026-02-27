const test = require("node:test");
const assert = require("node:assert/strict");

const callContract = require("../server/middleware/contractCaller.js");
const contractMiddleware = require("../server/middleware/index.js");

test("malformed remote response returns controlled 502 JSON", async () => {
  const mockClient = {
    post: async () => ({ data: undefined }),
  };

  const result = await callContract(
    "https://example.invalid/rpc",
    "Polygon Mainnet",
    mockClient
  );

  assert.equal(result.statusCode, 502);
  assert.equal(result.body.status, false);
  assert.equal(result.body.error.code, "UPSTREAM_RPC_ERROR");
});

test("payload with executable JS is treated as plain data", async () => {
  globalThis.__rpcInjectionExecuted = false;
  const executablePayload = "globalThis.__rpcInjectionExecuted = true";
  const mockClient = {
    post: async () => ({ data: executablePayload }),
  };

  const result = await callContract(
    "https://example.invalid/rpc",
    "Polygon Mainnet",
    mockClient
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data, executablePayload);
  assert.equal(globalThis.__rpcInjectionExecuted, false);

  delete globalThis.__rpcInjectionExecuted;
});

test("middleware index exports contract functions without side effects", () => {
  assert.equal(typeof contractMiddleware.PolygonContract, "function");
  assert.equal(typeof contractMiddleware.EthContract, "function");
});
