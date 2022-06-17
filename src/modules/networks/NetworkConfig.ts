interface NetworkAsset {
  id: string;
  address: null | string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface NetworkConfig {
  chain: string;
  name: string;
  icon_url: string;
  external_id: string;
  explorer_token_url: string | null;
  explorer_tx_url: string | null;
  explorer_home_url: string | null;
  explorer_name: string | null;
  rpc_url_internal: string | null;
  rpc_url_public: string[] | null;
  supports_trading: boolean;
  supports_sending: boolean;
  supports_bridge: boolean;
  native_asset: NetworkAsset | null;
  wrapped_native_asset: NetworkAsset | null;
}
