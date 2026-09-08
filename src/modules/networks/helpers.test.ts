import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import {
  synthesizeExplorer,
  toAddEthereumChainParameter,
  toNetworkInfo,
} from './helpers';
import type { NetworkInfo } from './NetworkInfo';

const param: AddEthereumChainParameter = {
  chainId: '0x27bc86aa',
  chainName: 'Degen',
  nativeCurrency: { name: 'Degen', symbol: 'DEGEN', decimals: 18 },
  rpcUrls: ['https://rpc.degen.tips/http', 'https://rpc.degen.tips/backup'],
  blockExplorerUrls: ['https://explorer.degen.tips/'],
  iconUrls: [''],
  hidden: false,
  is_testnet: true,
};

test('synthesizeExplorer derives etherscan-style templates from the home URL', () => {
  expect(synthesizeExplorer('https://explorer.degen.tips/')).toEqual({
    name: 'explorer.degen.tips',
    homeUrl: 'https://explorer.degen.tips',
    txUrl: 'https://explorer.degen.tips/tx/{HASH}',
    addressUrl: 'https://explorer.degen.tips/address/{ADDRESS}',
    tokenUrl: 'https://explorer.degen.tips/token/{ADDRESS}',
  });
});

test('toNetworkInfo synthesizes a chain the backend does not know', () => {
  const network = toNetworkInfo(param, null);
  expect(network).toEqual({
    id: 'zerion-custom-network-0x27bc86aa',
    name: 'Degen',
    iconUrl: null,
    testnet: true,
    specification: { eip155: { chainId: 666666666 } },
    explorer: synthesizeExplorer('https://explorer.degen.tips'),
    baseAsset: {
      id: 'degen',
      name: 'Degen',
      symbol: 'DEGEN',
      iconUrl: null,
      implementations: {
        'zerion-custom-network-0x27bc86aa': { address: null, decimals: 18 },
      },
    },
    flags: {
      supportsSending: true,
      supportsTrading: false,
      supportsBridging: false,
      supportsActions: false,
      supportsNftPositions: false,
      supportsPositions: false,
      supportsSponsoredTransactions: false,
      supportsGasPrices: false,
      supportsSimulations: false,
    },
    rpcUrl: 'https://rpc.degen.tips/http',
    publicRpcUrl: 'https://rpc.degen.tips/http',
    rpcUrlUser: 'https://rpc.degen.tips/http',
    hidden: false,
  });
});

test('toNetworkInfo keeps the id it is given and has no explorer without a home URL', () => {
  const network = toNetworkInfo(
    { ...param, blockExplorerUrls: undefined },
    'degen'
  );
  expect(network.id).toBe('degen');
  expect(network.explorer).toBeNull();
  expect(network.baseAsset?.implementations).toEqual({
    degen: { address: null, decimals: 18 },
  });
});

test('toAddEthereumChainParameter prefers the user RPC and carries the explorer home', () => {
  const network: NetworkInfo = {
    ...toNetworkInfo(param, 'degen'),
    rpcUrl: 'https://rpc.zerion.io/v1/degen',
    publicRpcUrl: 'https://rpc.degen.tips/http',
    rpcUrlUser: 'https://my-node.example/rpc',
    iconUrl: 'https://chain-icons.s3.amazonaws.com/degen.png',
  };
  expect(toAddEthereumChainParameter(network)).toEqual({
    chainId: '0x27bc86aa',
    chainName: 'Degen',
    rpcUrls: ['https://my-node.example/rpc'],
    nativeCurrency: { name: 'Degen', symbol: 'DEGEN', decimals: 18 },
    blockExplorerUrls: ['https://explorer.degen.tips'],
    iconUrls: ['https://chain-icons.s3.amazonaws.com/degen.png'],
    hidden: false,
    is_testnet: true,
  });
});

test('toAddEthereumChainParameter falls back to Zerion RPC, then the public one', () => {
  const base = toNetworkInfo(param, 'degen');
  expect(
    toAddEthereumChainParameter({
      ...base,
      rpcUrlUser: undefined,
      rpcUrl: 'https://rpc.zerion.io/v1/degen',
    }).rpcUrls
  ).toEqual(['https://rpc.zerion.io/v1/degen']);
  expect(
    toAddEthereumChainParameter({
      ...base,
      rpcUrlUser: undefined,
      rpcUrl: '',
      publicRpcUrl: 'https://rpc.degen.tips/http',
    }).rpcUrls
  ).toEqual(['https://rpc.degen.tips/http']);
});
