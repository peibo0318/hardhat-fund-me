const { ethers, getNamedAccounts } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  console.log("deployer is: ", typeof deployer);
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log(`Got contract FundMe at ${fundMe.address}`);
  console.log("Funding contract...");
  const transactionResponse = await fundMe.fund({
    value: ethers.utils.parseEther("1"),
    gasLimit: 30000000,
  });
  await transactionResponse.wait();
  console.log("Funded!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
