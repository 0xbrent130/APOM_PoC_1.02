const callContract = require('./contractCaller.js');
const { Heco } = require('../constant/constant.js');

const callHecoContract = async () => {
    return await callContract(Heco, 'HECO');
};

module.exports = callHecoContract; 