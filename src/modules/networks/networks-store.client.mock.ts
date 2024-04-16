import type { EthereumChainConfig } from '../ethereum/chains/ChainConfigStore';
import { NetworksStore } from './networks-store';

export const ETHEREUM_CHAIN_SOURCES: EthereumChainConfig[] = [];

export const networksStore = new NetworksStore(
  { networks: null },
  { getEthereumChainConfigs: () => Promise.resolve(ETHEREUM_CHAIN_SOURCES) }
);
