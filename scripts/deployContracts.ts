import { Contract } from "ethers";
import { ethers } from "hardhat";
import deployContracts, { DeployedInfoConfig } from "./deployContractsFunc";

async function setupAllowances(deployedInfo: DeployedInfoConfig) {
  const contracts: { [key: string]: Contract } = {};

  for (const key of Object.keys(deployedInfo)) {
    contracts[deployedInfo[key].contractName] = await ethers.getContractAt(
      deployedInfo[key].contractName,
      deployedInfo[key].address
    );
  }
  const gasPrice = (await ethers.provider.getGasPrice()).mul(12).div(10);
  // approve deployer's tRILLA to be spent by TokenClaim
  let tx = await contracts["tRILLA"].approve(
    contracts["TokenClaim"].address,
    ethers.constants.MaxUint256,
    { gasPrice }
  );
  await tx.wait();
  // approve deployer's rillaUSDC to be spent by Swap
  tx = await contracts["rillaUSDC"].approve(
    contracts["Swap"].address,
    ethers.constants.MaxUint256,
    { gasPrice }
  );
  await tx.wait();
}

async function init() {
  const deployedInfo = await deployContracts();
  await setupAllowances(deployedInfo);
}

if (typeof require !== "undefined" && require.main === module) {
  init();
}
