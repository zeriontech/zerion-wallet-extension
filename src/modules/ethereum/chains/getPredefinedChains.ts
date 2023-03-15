import { toNetworkConfig } from 'src/modules/networks/helpers';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { ChainConfig } from './ChainConfigStore';

const values: AddEthereumChainParameter[] = [
  {
    chainName: 'Arbitrum Goerli',
    chainId: '0x66eed',
    iconUrls: ['https://chain-icons.s3.amazonaws.com/ethereum.png'],
    nativeCurrency: {
      name: 'Arbitrum Goerli Ether',
      symbol: 'AGOR',
      decimals: 18,
    },
    rpcUrls: ['https://goerli-rollup.arbitrum.io/rpc/'],
    blockExplorerUrls: ['https://goerli-rollup-explorer.arbitrum.io'],
  },
  {
    iconUrls: ['https://chain-icons.s3.amazonaws.com/avalanche.png'],
    chainName: 'Avalanche Fuji Testnet',
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    chainId: '0xa869',
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
  },
  {
    chainName: 'Polygon Testnet Mumbai',
    iconUrls: ['https://chain-icons.s3.amazonaws.com/polygon.png'],
    rpcUrls: [
      'https://matic-mumbai.chainstacklabs.com',
      'https://rpc-mumbai.maticvigil.com',
      'https://matic-testnet-archive-rpc.bwarelabs.com',
    ],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    chainId: '0x13881',
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  {
    chainId: '0x5',
    chainName: 'Goerli',
    iconUrls: ['https://chain-icons.s3.amazonaws.com/ethereum.png'],
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
  await new Promise((r) => setTimeout(r, 800));
  return Promise.resolve({
    ethereumChains: values.map((value) => ({
      created: 0,
      updated: 0,
      origin: 'predefined',
      value: toNetworkConfig(value),
    })),
  });
}
