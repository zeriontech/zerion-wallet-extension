interface NetworkAsset {
  id: string;
  address: null | string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  id: string;
  evm_id?: number | null;
  node_urls?: string[];
  base_asset_id?: string;
  block_explorer_urls?: string[];
  is_testnet?: boolean;
  chain: string;
  name: string;
  icon_url: string;
  external_id: string;
  explorer_token_url: string | null;
  explorer_tx_url: string | null;
  explorer_address_url: string | null;
  explorer_home_url: string | null;
  explorer_name: string | null;
  rpc_url_internal: string | null;
  rpc_url_public: string[] | null;
  supports_trading: boolean;
  supports_sending: boolean;
  supports_bridge: boolean;
  native_asset: NetworkAsset | null;
  wrapped_native_asset: NetworkAsset | null;
  /**
   * Client-side value.
   * Whether to display this network among select options
   */
  hidden?: boolean;
  /**
   * Client-side value.
   * User-defined rpc url that has priority over rpc_url_internal
   */
  rpc_url_user?: string;
}
