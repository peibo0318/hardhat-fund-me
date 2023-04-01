const { network } = require("hardhat");
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");
const { Log } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments; //get deploy and log function from hre.deployments
  const { deployer } = await getNamedAccounts(); //getting the deployer account from hardhat.config
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log("Local network detected. Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mocks deployed.");
    log("------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
