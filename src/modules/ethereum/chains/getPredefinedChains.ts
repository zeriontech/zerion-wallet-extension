import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { ChainConfig } from './ChainConfigStore';

const chains: AddEthereumChainParameter[] = [
  {
    chainId: '0x5',
    chainName: 'Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://endpoints.omniatech.io/v1/eth/goerli/public',
      'https://rpc.ankr.com/eth_goerli',
      'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://eth-goerli.public.blastapi.io',
      'https://eth-goerli.g.alchemy.com/v2/demo',
      'https://goerli.blockpi.network/v1/rpc/public',
      'https://rpc.goerli.mudit.blog',
    ],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  },
];

export async function getPredefinedChains(): Promise<ChainConfig> {
  return Promise.resolve({
    ethereumChains: chains.map((chain) => ({
      created: 0,
      updated: 0,
      origin: 'predefined',
      chain,
    })),
  });
}
