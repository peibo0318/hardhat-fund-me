// function deployFunc() {
//   console.log("Hi");
// }

const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

// module.exports.default = deployFunc;

// below lines are identical to above but with a anonymous function
// module.exports = async (hre) => {
//   const { getNamedAccounts, deployments } = hre; // basically just hre.getNamedAccounts and hre.deployments
// };

// same as above
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments; //get deploy and log function from hre.deployments
  const { deployer } = await getNamedAccounts(); //getting the deployer account from hardhat.config
  const chainId = network.config.chainId;

  // if chainId is X use address Y, if chainId is A use address B

  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];

  let ethUsdPriceFeedAddress;
  if (chainId == 31337) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  //if the contract doesn't exist, we deploy a minimal version of it for our local testing

  //we want to be able to deploy to different chains, including a mock network
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put price feed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log("------------------------------------");
  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, args);
  }
};

module.exports.tags = ["all", "fundme"];
