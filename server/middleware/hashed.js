const callContract = require('./contractCaller.js');
const { Hashed } = require('../constant/constant.js');

const callHashedContract = async () => {
    return await callContract(Hashed, 'Hashed');
};

module.exports = callHashedContract; 