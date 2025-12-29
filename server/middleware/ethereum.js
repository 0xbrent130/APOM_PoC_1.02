const callContract = require('./contractCaller.js');
const { EthMainnet } = require('../constant/constant.js');

const callEthContract = async () => {
    return await callContract(EthMainnet, 'Ethereum Mainnet');
};

module.exports = callEthContract; 