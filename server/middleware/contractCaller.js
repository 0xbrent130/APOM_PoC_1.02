const axios = require('axios');
const { parseRemotePayload, buildRpcFailure } = require('./errorHandler.js');

const callContract = async (url, networkName, httpClient = axios) => {
  try {
    const response = await httpClient.post(
      url,
      {},
      { headers: { "x-secret-header": "secret" } }
    );

    const parsedResponse = parseRemotePayload(response?.data);

    if (parsedResponse.statusCode !== 200) {
      return parsedResponse;
    }

    return {
      statusCode: 200,
      body: {
        status: true,
        network: networkName,
        data: parsedResponse.body.data,
      },
    };
  } catch (_error) {
    return buildRpcFailure(`Remote RPC failure from ${networkName}.`);
  }
};

module.exports = callContract;
