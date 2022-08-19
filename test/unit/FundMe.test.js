const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let MockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1"); // 1 eth
          beforeEach(async function () {
              // deploy fundMe contract
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture("all");
              fundMe = await ethers.getContract("FundMe", deployer);
              // getContaract will give us the last deployed FundMe contract
              // we connected the deployer to FundMe account
              // we can get accounts also like this:
              // const accounts = await ethers.getSigners();
              // const accountzero = accounts[0];
              MockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.priceFeed();
                  assert.equal(response, MockV3Aggregator.address);
              });
          });
          describe("fund", async function () {
              it("fails if there is not enouph amount of ethers sent", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  );
              });
              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.addressToAmountFunded(deployer);
                  assert.equal(response.toString(), sendValue);
              });
              it("adds funders to the array", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.funders(0);
                  assert.equal(response, deployer);
              });
          });
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });
              it("withdraw money from a single funder", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  );
              });
              it("allows us to withdraw money from multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  );

                  await expect(fundMe.funders(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("only owner can withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  );
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(
                      fundMeConnectedContract,
                      "FundMe__NotOwner"
                  );
              });
          });
      });
