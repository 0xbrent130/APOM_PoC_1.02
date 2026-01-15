const callContract = require('./contractCaller.js');
const { BscMainnet } = require('../constant/constant.js');

const callBscContract = async () => {
    return await callContract(BscMainnet, 'BSC Mainnet');
};

module.exports = callBscContract;