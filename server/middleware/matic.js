const callContract = require('./contractCaller.js');
const { Matic } = require('../constant/constant.js');

const callMaticContract = async () => {
    return await callContract(Matic, 'Matic');
};

module.exports = callMaticContract; 