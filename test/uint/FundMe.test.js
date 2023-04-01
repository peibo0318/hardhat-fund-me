const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");
const { deployments, ethers, network, getNamedAccounts } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async function () {
        // deploy our fundMe contract using Hardhat-deploy
        // you can also get singers by using ethers.getSigners()
        // const accounts = ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer;
        // console.log("deployer is", deployer);
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.reverted;
        });

        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of funders", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          // console.log("funder is", funder);
          assert.equal(funder, deployer);
        });
      });
      describe("withdraw", function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt; // use breakpoints and debugger to get these info
          const gasCost = gasUsed.mul(effectiveGasPrice); // multiply for big numbers

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // gasCost
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // use add() because they are big numbers
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("allows us to withdraw with multiple funders", async function () {
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt; // use breakpoints and debugger to get these info
          const gasCost = gasUsed.mul(effectiveGasPrice); // multiply for big numbers
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // use add() because they are big numbers
            endingDeployerBalance.add(gasCost).toString()
          );

          //Make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only allows the owener to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          );
        });
        it("cheaperWithdraw testing ...", async function () {
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );

          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt; // use breakpoints and debugger to get these info
          const gasCost = gasUsed.mul(effectiveGasPrice); // multiply for big numbers
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // use add() because they are big numbers
            endingDeployerBalance.add(gasCost).toString()
          );

          //Make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
      });
    });
