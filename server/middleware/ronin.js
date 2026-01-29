const callContract = require('./contractCaller.js');
const { Ronin } = require('../constant/constant.js');

const callRoninContract = async () => {
    return await callContract(Ronin, 'Ronin');
};

module.exports = callRoninContract; 