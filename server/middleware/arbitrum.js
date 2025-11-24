const callContract = require('./contractCaller.js');
const { ArbitrumMainnet } = require('../constant/constant.js');

const callArbitrumContract = async () => {
    return await callContract(ArbitrumMainnet, 'Arbitrum Mainnet');
};

module.exports = callArbitrumContract; 