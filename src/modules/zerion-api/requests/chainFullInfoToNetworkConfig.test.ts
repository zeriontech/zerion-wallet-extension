import type { ChainFullInfo } from '../types/ChainFullInfo';
import { chainFullInfoToNetworkConfig } from './chainFullInfoToNetworkConfig';

const flags: ChainFullInfo['flags'] = {
  supportsTrading: true,
  supportsSending: true,
  supportsBridging: true,
  supportsActions: true,
  supportsPositions: true,
  supportsNftPositions: false,
  supportsSponsoredTransactions: false,
  supportsGasPrices: true,
  supportsSimulations: true,
};

const baseAsset: NonNullable<ChainFullInfo['baseAsset']> = {
  id: 'eth',
  name: 'Ethereum',
  symbol: 'ETH',
  iconUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
  verified: true,
  new: false,
  implementations: {
    // a native asset has a null implementation address on its own chain
    ethereum: { address: null, decimals: 18 },
    polygon: {
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
      decimals: 18,
    },
  },
  meta: {
    circulatingSupply: null,
    totalSupply: null,
    price: null,
    marketCap: null,
    fullyDilutedValuation: null,
    relativeChange1d: null,
    relativeChange30d: null,
    relativeChange90d: null,
    relativeChange365d: null,
  },
};

const ethereum: ChainFullInfo = {
  id: 'ethereum',
  name: 'Ethereum',
  iconUrl: 'https://chain-icons.s3.amazonaws.com/ethereum.png',
  testnet: false,
  specification: { eip155: { chainId: 1 } },
  explorer: {
    name: 'Etherscan',
    txUrl: 'https://etherscan.io/tx/{HASH}',
    tokenUrl: 'https://etherscan.io/token/{ADDRESS}',
    homeUrl: 'https://etherscan.io',
    addressUrl: 'https://etherscan.io/address/{ADDRESS}',
  },
  baseAsset,
  flags,
  rpcUrl: 'https://rpc.zerion.io/v1/ethereum',
  publicRpcUrl: 'https://eth.public.zerion.io',
};

test('maps an eip155 chain', () => {
  const network = chainFullInfoToNetworkConfig(ethereum);
  expect(network).toMatchObject({
    id: 'ethereum',
    name: 'Ethereum',
    standard: 'eip155',
    is_testnet: false,
    specification: { eip155: { id: 1 } },
    explorer_name: 'Etherscan',
    explorer_home_url: 'https://etherscan.io',
    rpc_url_internal: 'https://rpc.zerion.io/v1/ethereum',
    rpc_url_public: ['https://eth.public.zerion.io'],
    supports_sending: true,
    supports_nft_positions: false,
  });
});

test('native asset takes decimals and address from the chain implementation', () => {
  const network = chainFullInfoToNetworkConfig(ethereum);
  // `address === null` is what makes Networks.isNativeAddress work
  expect(network?.native_asset).toEqual({
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    icon_url: 'https://token-icons.s3.amazonaws.com/eth.png',
    decimals: 18,
    address: null,
  });
});

test('native asset is null when the chain has no implementation entry', () => {
  const network = chainFullInfoToNetworkConfig({
    ...ethereum,
    id: 'unlisted-chain',
    specification: { eip155: { chainId: 999 } },
  });
  expect(network?.native_asset).toBeNull();
});

test('explorer fields fall back to null when there is no explorer', () => {
  const network = chainFullInfoToNetworkConfig({
    ...ethereum,
    explorer: null,
    iconUrl: null,
  });
  expect(network).toMatchObject({
    icon_url: '',
    explorer_name: null,
    explorer_tx_url: null,
    explorer_token_url: null,
    explorer_address_url: null,
    explorer_home_url: null,
  });
});

test('maps a solana chain', () => {
  const network = chainFullInfoToNetworkConfig({
    ...ethereum,
    id: 'solana',
    name: 'Solana',
    baseAsset: null,
    specification: { solana: { genesisHash: 'genesis' } },
  });
  expect(network).toMatchObject({
    standard: 'solana',
    specification: { solana: { genesisHash: 'genesis' } },
  });
});

test('returns null for a standard the extension does not model', () => {
  const network = chainFullInfoToNetworkConfig({
    ...ethereum,
    id: 'tron',
    specification: { tron: { chainId: 728126428 } },
  });
  expect(network).toBeNull();
});
