const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

//let varaible = true
//let someVar = variable ? "yes" : "no"
// if (varaible) {someVar = "yes"} else {someVar = "no"}

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe;
      let deployer;
      const sendValue = ethers.utils.parseEther("0.1");
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), "0");
      });
    });
