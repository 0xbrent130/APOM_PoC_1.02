const callContract = require('./contractCaller.js');
const { Harmony } = require('../constant/constant.js');

const callHarmonyContract = async () => {
    return await callContract(Harmony, 'Harmony');
};

module.exports = callHarmonyContract; 