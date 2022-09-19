/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('solidity-coverage');
require("hardhat-gas-reporter");

module.exports = {
  solidity: "0.8.9",
};