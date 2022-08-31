import { DeployedInfo } from "./helpers/helpers";
import { Contract } from "ethers";
import { saveDeployedInfo } from "./helpers/helpers";
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
    const Contract = await ethers.getContractFactory(contractInfo.name);
    const gasLimit = (
      await ethers.provider.estimateGas(Contract.getDeployTransaction(...args))
    )
      .mul(12)
      .div(10);
    const gasPrice = (await ethers.provider.getGasPrice()).mul(12).div(10);
    const contract = await Contract.deploy(...args, { gasLimit, gasPrice });
    const deployedInfo = await getDeployedInfo(
      contract,
      contractInfo.name,
      args
    );
    deployedConfig[contractInfo.name] = deployedInfo;
    saveDeployedInfo(deployedInfo);
  }
  return deployedConfig;
}

export default async function deployContracts() {
  const signers = await ethers.getSigners();
  const accounts = await Promise.all(
    signers.map((signer) => signer.getAddress())
  );
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

  let deployedInfo: DeployedInfoConfig = {};
  if (!hre.network.config.chainId) {
    console.log(
      "please set chainId in hardhat.config.ts for the network you are attempting to use"
    );
    process.exit(1);
  }
  for (const contractConfig of [...deployContracts]) {
    if (
      fs.existsSync(
        path.join(
          __dirname,
          `../deployedContracts/${hre.network.config.chainId}/${contractConfig.name}.json`
        )
      )
    ) {
      deployContracts.splice(deployContracts.indexOf(contractConfig), 1);
      deployedInfo[contractConfig.name] = JSON.parse(
        fs
          .readFileSync(
            path.join(
              __dirname,
              `../deployedContracts/${hre.network.config.chainId}/${contractConfig.name}.json`
            )
          )
          .toString()
      );
    }
  }
  deployedInfo = await deployAllContracts(deployContracts, deployedInfo);
  return deployedInfo;
}
