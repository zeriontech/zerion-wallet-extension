import type { NetworkConfigMetaData } from 'src/modules/networks/Networks';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';

interface NetworkConfigStoredV0 {
  chain: string;
  explorer_address_url: string | null;
  explorer_home_url: string | null;
  explorer_name: string | null;
  explorer_token_url: string | null;
  explorer_tx_url: string | null;
  external_id: string;
  hidden: boolean;
  icon_url: string;
  id: string;
  name: string;
  native_asset: {
    address: string | null;
    decimals: number;
    id: string;
    name: string;
    symbol: string;
  };
  rpc_url_internal: string | null;
  rpc_url_public: string[];
  supports_bridge: boolean;
  supports_sending: boolean;
  supports_trading: boolean;
  wrapped_native_asset: null;
}
type DeprecatedEthereumChainConfig = NetworkConfigMetaData & {
  value: NetworkConfigStoredV0;
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
