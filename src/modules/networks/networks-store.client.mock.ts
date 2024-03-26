import type { ChainConfig } from '../ethereum/chains/ChainConfigStore';
import { NetworksStore } from './networks-store';

export const ETHEREUM_CHAIN_SOURCES: ChainConfig = {
  ethereumChains: [], // ddprecated
  ethereumChainConfigs: [],
  migratedToV1: false,
};

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainConfigs: () => Promise.resolve(ETHEREUM_CHAIN_SOURCES),
  }
);
