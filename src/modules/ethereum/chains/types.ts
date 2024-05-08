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

export interface ChainConfig {
  version: 2;
  ethereumChainConfigs?: EthereumChainConfig[];
  /** @deprecated */
  ethereumChains?: DeprecatedEthereumChainConfig[];
}
