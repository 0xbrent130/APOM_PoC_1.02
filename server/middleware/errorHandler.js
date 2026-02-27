const RPC_BAD_GATEWAY_STATUS = 502;

const buildRpcFailure = (message = "Remote RPC request failed.") => ({
  statusCode: RPC_BAD_GATEWAY_STATUS,
  body: {
    status: false,
    error: {
      code: "UPSTREAM_RPC_ERROR",
      message,
    },
  },
});

const parseRemotePayload = (payload) => {
  if (
    typeof payload === "undefined" ||
    typeof payload === "function" ||
    typeof payload === "symbol"
  ) {
    return buildRpcFailure("Malformed remote RPC response.");
  }

  return {
    statusCode: 200,
    body: {
      status: true,
      data: payload,
    },
  };
};

module.exports = {
  parseRemotePayload,
  buildRpcFailure,
  RPC_BAD_GATEWAY_STATUS,
};
