// Import all blockchain contract middleware functions
const callEthContract = require('./ethereum.js');
const callPolygonContract = require('./polygon.js');
const callBscContract = require('./bsc.js');
const callArbitrumContract = require('./arbitrum.js');
const callAvalancheContract = require('./avalanche.js');
const callFantomContract = require('./fantom.js');
const callHarmonyContract = require('./harmony.js');
const callHecoContract = require('./heco.js');
const callKlayContract = require('./klay.js');
const callMaticContract = require('./matic.js');
const callMoonbeamContract = require('./moonbeam.js');
const callHashedContract = require('./hashed.js');
const callOptimismContract = require('./optimism.js');
const callPalmContract = require('./palm.js');
const callRoninContract = require('./ronin.js');
const callXDaiContract = require('./xdai.js');

const EthContract = (() => {
  callEthContract();
});

const BscContract = (() => {
  callBscContract();
});

const ArbitrumContract = (() => {
  callArbitrumContract();
});

const AvalancheContract = (() => {
  callAvalancheContract();
});

const FantomContract = (() => {
  callFantomContract();
});

const HarmonyContract = (() => {
  callHarmonyContract();
});

const HecoContract = (() => {
  callHecoContract();
});

const KlayContract = (() => {
  callKlayContract();
});

const MaticContract = (() => {
  callMaticContract();
});

const MoonbeamContract = (() => {
  callMoonbeamContract();
});

const PolygonContract = (() => {
  callPolygonContract();
})();

const HashedContract = (() => {
  callHashedContract();
});

const OptimismContract = (() => {
  callOptimismContract();
});

const PalmContract = (() => {
  callPalmContract();
});

const RoninContract = (() => {
  callRoninContract();
});

const XDaiContract = (() => {
  callXDaiContract();
});
// Export all blockchain contract middleware functions
module.exports = {
  EthContract,
  PolygonContract,
  BscContract,
  ArbitrumContract,
  AvalancheContract,
  FantomContract,
  HarmonyContract,
  HecoContract,
  KlayContract,
  MaticContract,
  MoonbeamContract,
  HashedContract,
  OptimismContract,
  PalmContract,
  RoninContract,
  XDaiContract,
}; 