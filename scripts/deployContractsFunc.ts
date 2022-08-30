import { DeployedInfo } from "./helpers/helpers";
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

export interface DeployedInfoConfig {
  [contractName: string]: {
    address: string;
    abi: Object;
    network: { chainId: number; name: string };
    verified: boolean;
    deployedTransaction: Object;
    contractName: string;
    constructorArguments: any[];
  };
}

function getArgs(args: any[], deployedInfo: any) {
  const argCopy = [];
  for (const arg of args) {
    if (typeof arg === "string" || arg instanceof String) {
      if (arg.includes(".") && isNaN(Number(arg))) {
        const splArg = arg.split(".");
        argCopy.push(deployedInfo[splArg[0]][splArg[1]]);
        continue;
      }
    }
    argCopy.push(arg);
  }
  return argCopy;
}

async function deployAllContracts(
  deployContracts: any[],
  deployedConfig: DeployedInfoConfig
) {
  for (const contractInfo of deployContracts) {
    const args = getArgs(contractInfo.args, deployedConfig);
    const deployedInfo = await ethers
      .getContractFactory(contractInfo.name)
      .then((Contract) => Contract.deploy(...args))
      .then((contract) => getDeployedInfo(contract, contractInfo.name, args));
    deployedConfig[contractInfo.name] = deployedInfo;
  }
  return deployedConfig;
}

export default async function deployContracts() {
  const signers = await ethers.getSigners();
  const accounts = await Promise.all(
    signers.map((signer) => signer.getAddress())
  );
  console.log(accounts[0]);
  const deployedConfig: DeployedInfoConfig = {};
  const deployContracts: { name: string; args: any[] }[] = [
    { name: "rillaUSDC", args: [] },
    { name: "tRILLA", args: [] },
    { name: "Swap", args: ["tRILLA.address", "rillaUSDC.address"] },
    {
      name: "DonationRouter",
      args: [
        accounts[10],
        accounts[11],
        "5" + "0".repeat(15),
        "Swap.address",
        "rillaUSDC.address",
      ],
    },
    {
      name: "VoteEscrow",
      args: ["tRILLA.address", "Vote Escrowed tRILLA", "vetRILLA", "1.0"],
    },
    { name: "TokenClaim", args: ["tRILLA.address", "1000"] },
  ];
  for (const contractConfig of deployContracts) {
    if (
      fs.existsSync(
        path.join(
          __dirname,
          `../deployedContracts/${hre.network.config.chainId}/${contractConfig.name}.json`
        )
      )
    ) {
      deployContracts.splice(deployContracts.indexOf(contractConfig));
    }
  }
  // const deployedInfo: DeployedInfoConfig = {};
  const deployedInfo = await deployAllContracts(
    deployContracts,
    deployedConfig
  );
  return deployedInfo;
}
