require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');


//const { MNEMONIC, PROJECT_ID } = process.env;

module.exports = {
  contracts_build_directory: "../daap/contracts_json",
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: "7545",
      network_id: "5777",
    },
    // sepolia: {
    //   provider: () => new HDWalletProvider('master myself argue diagram father true virus six number tired wink grocery', 'https://eth-sepolia.g.alchemy.com/v2/QmSQM1Erb_SSmy-e60ffxPEUpCS0o-y5'),
    //   network_id: "11155111",

    //   confirmations: 2,
    //   timeoutBlocks: 200,
    //   networkCheckTimeout: 10000000,
    //   skipDryRun: true
    // }
  },
  mocha: {
    // timeout: 100000
  },
  compilers: {
    solc: {
      version: "0.5.0", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  }
};
