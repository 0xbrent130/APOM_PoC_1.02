const callContract = require('./contractCaller.js');
const { Moonbeam } = require('../constant/constant.js');

const callMoonbeamContract = async () => {
    return await callContract(Moonbeam, 'Moonbeam');
};

module.exports = callMoonbeamContract; 