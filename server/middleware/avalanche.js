const callContract = require('./contractCaller.js');
const { Avalanche } = require('../constant/constant.js');

const callAvalancheContract = async () => {
    return await callContract(Avalanche, 'Avalanche');
};

module.exports = callAvalancheContract; 