const callContract = require('./contractCaller.js');
const { Klay } = require('../constant/constant.js');

const callKlayContract = async () => {
    return await callContract(Klay, 'Klaytn');
};

module.exports = callKlayContract; 