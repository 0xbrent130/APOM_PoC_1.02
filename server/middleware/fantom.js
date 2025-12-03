const callContract = require('./contractCaller.js');
const { Fantom } = require('../constant/constant.js');

const callFantomContract = async () => {
    return await callContract(Fantom, 'Fantom');
};

module.exports = callFantomContract; 