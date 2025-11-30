const callContract = require('./contractCaller.js');
const { Optimism } = require('../constant/constant.js');

const callOptimismContract = async () => {
    return await callContract(Optimism, 'Optimism');
};

module.exports = callOptimismContract; 