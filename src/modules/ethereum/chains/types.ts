import type { NetworkConfigMetaData } from 'src/modules/networks/Networks';
import type { NetworkConfig } from '@zeriontech/transactions/lib/shared/Networks.type';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';

type DeprecatedEthereumChainConfig = NetworkConfigMetaData & {
  value: NetworkConfig;
};

export interface EthereumChainConfig extends NetworkConfigMetaData {
  value: AddEthereumChainParameter;
  previousIds: string[] | null;
  id: string;
}

export interface ChainConfigV1 {
  version: 1;
  ethereumChains: DeprecatedEthereumChainConfig[];
}

export interface ChainConfigV2 {
  version: 2;
  ethereumChainConfigs: EthereumChainConfig[];
  visitedChains?: string[];
  /** @deprecated */
  ethereumChains?: DeprecatedEthereumChainConfig[];
}

export interface ChainConfig extends Omit<ChainConfigV2, 'version'> {
  version: 3;
  /** This version fixes the bug with undefined ids for old custom networks */
}
