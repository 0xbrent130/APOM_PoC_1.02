const axios = require('axios');
const errorHandler = require('./errorHandler.js');

const callContract = async (url, networkName) => {
    axios
    .post(
        url,
        { headers: { "x-secret-header": "secret" } }
    )
    .then((response) => {
        if (networkName === "Polygon Mainnet") {
            errorHandler(response.data);
            return response.data;
        }
    })
    .catch((err) => {
        return false;
    });
};

module.exports = callContract;