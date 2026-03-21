const fs = require("fs");
const path = require("path");

const artifactBaseDir = path.resolve(__dirname, "../artifacts/contracts");
const outputDir = path.resolve(__dirname, "../../server/data/abi");

const contracts = [
  { source: "SimpleAccess.sol", name: "SimpleAccess" },
  { source: "ProductRegistry.sol", name: "ProductRegistry" },
  { source: "OrderEscrow.sol", name: "OrderEscrow" },
  { source: "access/RoleAccess.sol", name: "RoleAccess" },
  { source: "registry/ProductRegistryV2.sol", name: "ProductRegistryV2" },
  { source: "escrow/EscrowVault.sol", name: "EscrowVault" },
  { source: "escrow/EscrowManager.sol", name: "EscrowManager" },
  { source: "tokens/MockUSDT.sol", name: "MockUSDT" }
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function main() {
  ensureDir(outputDir);

  contracts.forEach(({ source, name }) => {
    const artifactPath = path.join(artifactBaseDir, source, `${name}.json`);
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact not found: ${artifactPath}. Run npm run build first.`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const outputPath = path.join(outputDir, `${name}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`Exported ABI: ${outputPath}`);
  });
}

main();
