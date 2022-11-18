// run with npx ts-node getCompletedUsers.ts
import { chain, configureChains, readContracts, createClient } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import fs from 'fs'
import dotenv from 'dotenv'

async function getUsers() {
  dotenv.config()
  const { provider } = configureChains(
    [chain.goerli],
    [alchemyProvider({ apiKey: 'UmD8CD8alHdtO5vzj-fu4uQvjOZzcGxu' })]
  )
  const VoteEscrow = JSON.parse(
    fs.readFileSync('../deployedContracts/5/VoteEscrow.json').toString()
  )
  const DonationRouter = JSON.parse(
    fs.readFileSync('../deployedContracts/5/DonationRouter.json').toString()
  )
  createClient({ provider })
  const donRouter = await readContracts({
    contracts: [
      {
        addressOrName: DonationRouter.address,
        contractInterface: DonationRouter.abi,
        functionName: 'getInteracted',
      },
    ],
  })
  const donatedAddresses = Array.from(new Set(donRouter[0]))
  const vetRILLABalances = await readContracts({
    contracts: donatedAddresses.map((addr) => ({
      addressOrName: VoteEscrow.address,
      contractInterface: VoteEscrow.abi,
      functionName: 'user_point_history__ts',
      args: [addr, 1],
    })),
  })
  // create array containing address && balance > 0
  const filtered = donatedAddresses.filter(
    (_, i) => vetRILLABalances[i].toString() !== '0'
  )
  // select 3 random from that set
  const selected = [
    filtered[Math.floor(Math.random() * filtered.length)],
    filtered[Math.floor(Math.random() * filtered.length)],
    filtered[Math.floor(Math.random() * filtered.length)],
  ]
    // print it out
    console.log(selected)
}

getUsers()
