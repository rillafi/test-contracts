import { saveDeployedInfo, DeployedInfo } from "./helpers/helpers";
import { Contract } from "ethers";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
async function getDeployedInfo(
  contract: Contract,
  contractName: string,
  constructorArguments: any[]
): Promise<DeployedInfo> {
  return {
    abi: JSON.parse(
      contract.interface.format(ethers.utils.FormatTypes.json) as string
    ),
    deployedTransaction: contract.deployTransaction,
    address: contract.address,
    network: await contract.provider.getNetwork(),
    verified: false,
    contractName: contractName,
    constructorArguments,
  };
}

async function main() {
    const ve = require("../deployedContracts/5/VoteEscrow.json");
    const cont = await ethers.getContractAt(ve.abi, ve.address);
    console.log(cont.functions)

}

main()
