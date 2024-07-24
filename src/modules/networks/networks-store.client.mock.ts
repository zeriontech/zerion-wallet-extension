import { client } from 'defi-sdk';
import type { EthereumChainConfig } from '../ethereum/chains/types';
import type { ChainId } from '../ethereum/transactions/ChainId';
import type { NetworkConfig } from './NetworkConfig';
import { Networks } from './Networks';
import { networksFallbackInfo } from './networks-fallback';
import { NetworksStore } from './networks-store';

export const ETHEREUM_CHAIN_SOURCES: EthereumChainConfig[] = [
  {
    created: 1711739146223,
    id: 'degen',
    origin: 'https://bridge.degen.tips',
    previousIds: ['Ck3nlgufwtdxhadnDhyHj'],
    updated: 1711739146223,
    value: {
      blockExplorerUrls: [],
      chainId: '0x27bc86aa',
      chainName: 'Degen',
      hidden: false,
      iconUrls: [''],
      nativeCurrency: {
        decimals: 18,
        name: 'Degen',
        symbol: 'DEGEN',
      },
      rpcUrls: ['https://rpc.degen.tips/http'],
    },
  },
  {
    created: 1715170014372,
    id: 'arbitrum',
    origin: 'chrome-extension://klghhnkeealcohjjanjjdaeeggmfmlpl',
    previousIds: null,
    updated: 1715170014372,
    value: {
      blockExplorerUrls: ['https://arbiscan.io/address/{ADDRESS}'],
      chainId: '0xa4b1',
      chainName: 'Arbitrum123',
      iconUrls: ['https://chain-icons.s3.amazonaws.com/arbitrum.png'],
      nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
      rpcUrls: ['https://rpc.zerion.io/v1/arbitrum'],
    },
  },
  {
    created: 1715170135504,
    id: 'zerion-custom-network-0x1231231231',
    origin: 'https://zerion-tech.atlassian.net',
    previousIds: ['FlDuCHqCGIqflJdpAHAtX'],
    updated: 1715170135504,
    value: {
      blockExplorerUrls: [],
      chainId: '0x1231231231',
      chainName: 'My Own Chain',
      hidden: false,
      iconUrls: [''],
      nativeCurrency: {
        decimals: 18,
        name: 'ETH',
        symbol: 'ETH',
      },
      rpcUrls: ['https://rpc.scroll.io'],
    },
  },
  {
    created: 1715170143534,
    id: 'scroll',
    origin: 'https://zerion-tech.atlassian.net',
    previousIds: null,
    updated: 1715170143534,
    value: {
      blockExplorerUrls: ['https://scrollscan.com/address/{ADDRESS}'],
      chainId: '0x82750',
      chainName: 'Scroll',
      iconUrls: ['https://chain-icons.s3.amazonaws.com/scroll.png'],
      nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
      rpcUrls: ['https://rpc.scroll.io'],
    },
  },
];

class NetworksStoreMock extends NetworksStore {
  async load() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.getState().networks!;
  }

  async update() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.getState().networks!;
  }

  async loadNetworksByChainId(_chainId: ChainId) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.getState().networks!;
  }

  async pushConfigs(..._extraNetworkConfigs: NetworkConfig[]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.getState().networks!;
  }
}

export const networksStore = new NetworksStoreMock(
  {
    networks: new Networks({
      networks: networksFallbackInfo,
      ethereumChainConfigs: ETHEREUM_CHAIN_SOURCES,
      visitedChains: [],
    }),
  },
  { getOtherNetworkData: null, client, testnetMode: false }
);
