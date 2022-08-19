const { assert, expect } = require("chai");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.utils.parseEther("0.08");
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
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
          /*it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingBalance.toString(), "0");
          });*/
      });
