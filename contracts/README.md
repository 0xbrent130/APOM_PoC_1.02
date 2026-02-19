# APOM Contracts (PoC)

Minimal smart contract setup for Proof of Concept only.

## Includes (Simple + Advanced)

- Basic PoC:
  - `SimpleAccess`
  - `ProductRegistry`
  - `OrderEscrow`
- Advanced modular PoC:
  - `access/RoleAccess`
  - `common/ProtocolTypes`, `common/ProtocolErrors`, `common/ProtocolEvents`
  - `interfaces/IProductRegistry`, `interfaces/IERC20Minimal`
  - `registry/ProductRegistryV2`
  - `escrow/EscrowVault`, `escrow/EscrowManager`
  - `tokens/MockUSDT`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Compile contracts:

```bash
npm run build
```

3. Export ABIs for backend usage:

```bash
npm run export:abi
```

ABI outputs are written to `server/data/abi`.

## Suggested Folder Layout

```text
contracts/
  access/
  common/
  interfaces/
  registry/
  escrow/
  tokens/
```

## Deploy

Local node:

```bash
npm run deploy:local
```

Sepolia:

1. Copy `.env.example` to `.env`
2. Fill `SEPOLIA_RPC_URL` and `PRIVATE_KEY`
3. Run:

```bash
npm run deploy:sepolia
```
