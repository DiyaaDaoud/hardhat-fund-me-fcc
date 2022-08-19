/*function deployFunc() {
  console.log("Hi!");
}

module.exports.default = deployFunc;

*/
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { getNamedAccounts, deployments, network } = require("hardhat");
const { verify } = require("../utils/verify");
// the function below should take hre (hardhat runtime env, which is basically the same as hardhat),
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }
    log("----------------------------------------------------");
    log("Deploying FundMe and waiting for confirmations...");
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], // put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log(`fundMe deployed at ${fundMe.address}`);
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress]);
    }
};
module.exports.tags = ["all", "fundme"];
