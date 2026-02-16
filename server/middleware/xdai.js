const callContract = require('./contractCaller.js');
const { xDai } = require('../constant/constant.js');

const callXDaiContract = async () => {
    return await callContract(xDai, 'xDai');
};

module.exports = callXDaiContract; 