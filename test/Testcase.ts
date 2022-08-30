import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { saveDeployedInfo, DeployedInfo } from "../scripts/helpers/helpers";
import deployContracts, {
  DeployedInfoConfig,
} from "../scripts/deployContractsFunc";

interface ContractObj {
  [key: string]: Contract;
}
interface Account {
  signer: Signer;
  address: string;
}

async function getContract(deployed: DeployedInfo) {
  const eth = ethers.getContractAt(deployed.contractName, deployed.address);
  return eth;
}
describe("Testcase", async function () {
  let deployed: DeployedInfoConfig;
  let contracts: ContractObj = {};
  let signers: Signer[];
  let addresses: string[];
  let deployer: Account;
  let user: Account;
  let charity: Account;
  let fees: Account;
  before(async function () {
    signers = await ethers.getSigners();
    addresses = await Promise.all(signers.map((signer) => signer.getAddress()));
    deployer = { signer: signers[0], address: addresses[0] };
    user = { signer: signers[1], address: addresses[1] };
    charity = { signer: signers[10], address: addresses[10] };
    fees = { signer: signers[11], address: addresses[11] };
    deployed = await deployContracts();
    for (const key of Object.keys(deployed)) {
      const contract = await getContract(deployed[key]);
      contracts[key] = contract;
    }
  });

  it("Sets allowances from owner", async function () {
    // approve deployer's tRILLA to be spent by TokenClaim
    let tx = await contracts["tRILLA"].approve(
      contracts["TokenClaim"].address,
      ethers.constants.MaxUint256
    );
    await tx.wait();
    // approve deployer's rillaUSDC to be spent by Swap
    tx = await contracts["rillaUSDC"].approve(
      contracts["Swap"].address,
      ethers.constants.MaxUint256
    );
    await tx.wait();
    // approve user's tRILLA to be spent by Swap
    tx = await contracts["tRILLA"]
      .connect(user.signer)
      .approve(contracts["Swap"].address, ethers.constants.MaxUint256);
    await tx.wait();
    // approves user's tRILLA to be spent by DonationRouter
    tx = await contracts["tRILLA"]
      .connect(user.signer)
      .approve(
        contracts["DonationRouter"].address,
        ethers.constants.MaxUint256
      );
    await tx.wait();
    // approves user's rillaUSDC to be spent by DonationRouter
    tx = await contracts["rillaUSDC"]
      .connect(user.signer)
      .approve(
        contracts["DonationRouter"].address,
        ethers.constants.MaxUint256
      );
    await tx.wait();
  });

  it("allows claim of tRILLA, but not a second claim", async function () {
    let bal1 = await contracts["tRILLA"].balanceOf(user.address);
    let tx = await contracts["TokenClaim"].connect(user.signer).claimTokens();
    await tx.wait();
    let bal2 = await contracts["tRILLA"].balanceOf(user.address);
    expect(Number(ethers.utils.formatEther(bal1))).to.be.lessThan(
      Number(ethers.utils.formatEther(bal2))
    );
    await expect(contracts["TokenClaim"].connect(user.signer).claimTokens()).to
      .be.reverted;
    let bal3 = await contracts["tRILLA"].balanceOf(user.address);
    expect(Number(ethers.utils.formatEther(bal2))).to.equal(
      Number(ethers.utils.formatEther(bal3))
    );
  });

  it("swaps", async function () {
    let tbal1 = await contracts["tRILLA"].balanceOf(user.address);
    let rbal1 = await contracts["rillaUSDC"].balanceOf(user.address);
    let abal1 = await contracts["rillaUSDC"].balanceOf(deployer.address);
    let tx = await contracts["Swap"]
      .connect(user.signer)
      .swap(user.address, "10" + "0".repeat(18));
    await tx.wait();
    let tbal2 = await contracts["tRILLA"].balanceOf(user.address);
    let rbal2 = await contracts["rillaUSDC"].balanceOf(user.address);
    let abal2 = await contracts["rillaUSDC"].balanceOf(deployer.address);
    expect(Number(ethers.utils.formatEther(tbal1))).to.be.greaterThan(
      Number(ethers.utils.formatEther(tbal2))
    );
    expect(Number(ethers.utils.formatEther(rbal1))).to.be.lessThan(
      Number(ethers.utils.formatEther(rbal2))
    );
    expect(Number(ethers.utils.formatEther(abal1))).to.be.greaterThan(
      Number(ethers.utils.formatEther(abal2))
    );
  });

  it("donates rillaUSDC", async function () {
    let rbal1 = await contracts["rillaUSDC"].balanceOf(user.address);
    let tx = await contracts["DonationRouter"]
      .connect(user.signer)
      .donate(contracts["rillaUSDC"].address, rbal1);
    await tx.wait();
    let cbal = await contracts["rillaUSDC"].balanceOf(charity.address);
    let fbal = await contracts["rillaUSDC"].balanceOf(fees.address);
    let rbal2 = await contracts["rillaUSDC"].balanceOf(user.address);
    expect(Number(ethers.utils.formatEther(cbal))).to.be.greaterThan(0);
    expect(Number(ethers.utils.formatEther(fbal))).to.be.greaterThan(0);
    expect(Number(ethers.utils.formatEther(rbal1))).to.be.greaterThan(
      Number(ethers.utils.formatEther(rbal2))
    );
  });

  it("donates tRILLA", async function () {
    let tbal1 = await contracts["tRILLA"].balanceOf(user.address);
    let cbal1 = await contracts["rillaUSDC"].balanceOf(charity.address);
    let fbal1 = await contracts["rillaUSDC"].balanceOf(fees.address);
    let obal1 = await contracts["tRILLA"].balanceOf(deployer.address);
    let tx = await contracts["DonationRouter"]
      .connect(user.signer)
      .donate(contracts["tRILLA"].address, tbal1.div(10).toString());
    await tx.wait();
    let tbal2 = await contracts["tRILLA"].balanceOf(user.address);
    let cbal2 = await contracts["rillaUSDC"].balanceOf(charity.address);
    let fbal2 = await contracts["rillaUSDC"].balanceOf(fees.address);
    let obal2 = await contracts["tRILLA"].balanceOf(deployer.address);
    expect(Number(ethers.utils.formatEther(obal2))).to.be.above(
      Number(ethers.utils.formatEther(obal1))
    );
    expect(Number(ethers.utils.formatEther(tbal1))).to.be.above(
      Number(ethers.utils.formatEther(tbal2))
    );
    expect(Number(ethers.utils.formatEther(cbal2))).to.be.above(
      Number(ethers.utils.formatEther(cbal1))
    );
    expect(Number(ethers.utils.formatEther(fbal2))).to.be.above(
      Number(ethers.utils.formatEther(fbal1))
    );
  });
});
