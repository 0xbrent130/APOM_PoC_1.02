const callContract = require('./contractCaller.js');
const { Palm } = require('../constant/constant.js');

const callPalmContract = async () => {
    return await callContract(Palm, 'Palm');
};

module.exports = callPalmContract; 