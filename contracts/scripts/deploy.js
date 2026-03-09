const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const simpleAccessFactory = await hre.ethers.getContractFactory("SimpleAccess");
  const simpleAccess = await simpleAccessFactory.deploy();
  await simpleAccess.waitForDeployment();

  const productRegistryFactory = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = await productRegistryFactory.deploy();
  await productRegistry.waitForDeployment();

  const orderEscrowFactory = await hre.ethers.getContractFactory("OrderEscrow");
  const orderEscrow = await orderEscrowFactory.deploy();
  await orderEscrow.waitForDeployment();

  const productRegistryV2Factory = await hre.ethers.getContractFactory("ProductRegistryV2");
  const productRegistryV2 = await productRegistryV2Factory.deploy();
  await productRegistryV2.waitForDeployment();

  const escrowManagerFactory = await hre.ethers.getContractFactory("EscrowManager");
  const escrowManager = await escrowManagerFactory.deploy(await productRegistryV2.getAddress());
  await escrowManager.waitForDeployment();

  const mockUsdtFactory = await hre.ethers.getContractFactory("MockUSDT");
  const mockUsdt = await mockUsdtFactory.deploy(1_000_000_000_000, deployer.address);
  await mockUsdt.waitForDeployment();

  console.log("SimpleAccess:", await simpleAccess.getAddress());
  console.log("ProductRegistry:", await productRegistry.getAddress());
  console.log("OrderEscrow:", await orderEscrow.getAddress());
  console.log("ProductRegistryV2:", await productRegistryV2.getAddress());
  console.log("EscrowManager:", await escrowManager.getAddress());
  console.log("EscrowVault:", await escrowManager.vault());
  console.log("MockUSDT:", await mockUsdt.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
