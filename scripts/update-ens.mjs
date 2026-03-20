import { ethers } from "ethers";
import contentHash from "@ensdomains/content-hash";

const { ENS_NAME, ENS_PRIVATE_KEY, ETH_RPC_URL, IPFS_CID } = process.env;

if (!ENS_NAME || !ENS_PRIVATE_KEY || !ETH_RPC_URL || !IPFS_CID) {
  console.error("Missing required env vars: ENS_NAME, ENS_PRIVATE_KEY, ETH_RPC_URL, IPFS_CID");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
const wallet = new ethers.Wallet(ENS_PRIVATE_KEY, provider);

const namehash = ethers.namehash(ENS_NAME);

// Resolve the ENS name's resolver contract
const ensRegistry = new ethers.Contract(
  "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
  ["function resolver(bytes32 node) view returns (address)"],
  provider
);

const resolverAddr = await ensRegistry.resolver(namehash);
if (resolverAddr === ethers.ZeroAddress) {
  console.error(`No resolver set for ${ENS_NAME}`);
  process.exit(1);
}

const resolver = new ethers.Contract(
  resolverAddr,
  ["function setContenthash(bytes32 node, bytes calldata hash) external"],
  wallet
);

// Encode IPFS CID as ENS content hash (ipfs-ns codec)
const encoded = "0x" + contentHash.encode("ipfs-ns", IPFS_CID);

console.log(`Setting content hash for ${ENS_NAME}`);
console.log(`  IPFS CID: ${IPFS_CID}`);
console.log(`  Resolver: ${resolverAddr}`);
console.log(`  Content hash: ${encoded}`);

const tx = await resolver.setContenthash(namehash, encoded);
console.log(`  Tx hash: ${tx.hash}`);

const receipt = await tx.wait();
console.log(`  Confirmed in block ${receipt.blockNumber}`);
