const callContract = require('./contractCaller.js');
const { PolygonMainnet } = require('../constant/constant.js');

const callPolygonContract = async () => {
    return await callContract(PolygonMainnet, 'Polygon Mainnet');
};

module.exports = callPolygonContract; 