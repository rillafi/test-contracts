import { saveDeployedInfo } from "./helpers/helpers";
import { ethers } from "hardhat";
import deployContracts from "./deployContractsFunc";

async function init() {
  const deployedInfo = await deployContracts();
  for (const key of Object.keys(deployedInfo)) {
    saveDeployedInfo(deployedInfo[key]);
  }
}

if (typeof require !== "undefined" && require.main === module) {
  init();
}
