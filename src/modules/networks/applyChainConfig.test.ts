import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import { applyChainConfig } from './applyChainConfig';
import type { NetworkInfo } from './NetworkInfo';

const ethereum: NetworkInfo = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
  testnet: false,
  specification: { eip155: { chainId: 1 } },
  explorer: {
    name: 'etherscan',
    txUrl: 'https://etherscan.io/tx/{HASH}',
    tokenUrl: 'https://etherscan.io/token/{ADDRESS}',
    homeUrl: 'https://etherscan.io',
    addressUrl: 'https://etherscan.io/address/{ADDRESS}',
  },
  baseAsset: {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    iconUrl: 'https://cdn.zerion.io/eth.png',
    implementations: {
      ethereum: { address: null, decimals: 18 },
      polygon: {
        address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
        decimals: 18,
      },
    },
  },
  flags: {
    supportsTrading: true,
    supportsSending: true,
    supportsBridging: true,
    supportsActions: true,
    supportsPositions: true,
    supportsNftPositions: true,
    supportsSponsoredTransactions: false,
    supportsGasPrices: true,
    supportsSimulations: true,
  },
  rpcUrl: 'https://rpc.zerion.io/v1/ethereum',
  publicRpcUrl: 'https://ethereum-rpc.publicnode.com',
};

const edit: AddEthereumChainParameter = {
  chainId: '0x1',
  chainName: 'My Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://my-node.example/rpc'],
  blockExplorerUrls: ['https://blockscout.com/eth/mainnet'],
  iconUrls: [],
  hidden: true,
};

test('returns the network untouched without a chain config', () => {
  expect(applyChainConfig(ethereum, null)).toBe(ethereum);
});

test('overrides only what the form can edit', () => {
  const network = applyChainConfig(ethereum, edit);
  expect(network).toEqual({
    ...ethereum,
    name: 'My Ethereum',
    explorer: {
      ...ethereum.explorer,
      homeUrl: 'https://blockscout.com/eth/mainnet',
    },
    publicRpcUrl: 'https://my-node.example/rpc',
    rpcUrlUser: 'https://my-node.example/rpc',
    baseAsset: {
      ...ethereum.baseAsset,
      name: 'Ether',
      symbol: 'ETH',
    },
    hidden: true,
  });
  // Zerion's RPC, the flags, the backend asset id and icon are kept
  expect(network.rpcUrl).toBe(ethereum.rpcUrl);
  expect(network.flags).toBe(ethereum.flags);
  expect(network.baseAsset?.id).toBe('eth');
  expect(network.baseAsset?.iconUrl).toBe('https://cdn.zerion.io/eth.png');
  expect(network.baseAsset?.implementations.polygon).toEqual(
    ethereum.baseAsset?.implementations.polygon
  );
});

test('user-defined testnet flag wins over the backend one', () => {
  expect(
    applyChainConfig(ethereum, { ...edit, is_testnet: true }).testnet
  ).toBe(true);
  expect(applyChainConfig(ethereum, edit).testnet).toBe(false);
});

test('synthesizes an explorer when the network had none', () => {
  const network = applyChainConfig({ ...ethereum, explorer: null }, edit);
  expect(network.explorer).toEqual({
    name: 'blockscout.com',
    homeUrl: 'https://blockscout.com/eth/mainnet',
    txUrl: 'https://blockscout.com/eth/mainnet/tx/{HASH}',
    addressUrl: 'https://blockscout.com/eth/mainnet/address/{ADDRESS}',
    tokenUrl: 'https://blockscout.com/eth/mainnet/token/{ADDRESS}',
  });
});

test('a chain without a backend base asset gets one from the config', () => {
  const network = applyChainConfig(
    { ...ethereum, id: 'unlisted', baseAsset: null },
    { ...edit, nativeCurrency: { name: 'Gas', symbol: 'GAS', decimals: 9 } }
  );
  expect(network.baseAsset).toEqual({
    id: 'gas',
    name: 'Gas',
    symbol: 'GAS',
    iconUrl: null,
    implementations: { unlisted: { address: null, decimals: 9 } },
  });
});
