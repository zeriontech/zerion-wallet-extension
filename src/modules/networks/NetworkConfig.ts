interface NetworkAsset {
  id: string;
  address: null | string;
  name: string;
  symbol: string;
  decimals: number;
}

type NetworkSpecification = {
  standard: 'eip155';
  specification: {
    eip155: {
      eip1559: boolean;
      id: number;
    };
  };
};

export type NetworkConfig = NetworkSpecification & {
  id: string;
  is_testnet?: boolean;
  name: string;
  icon_url: string;
  explorer_token_url: string | null;
  explorer_tx_url: string | null;
  explorer_address_url: string | null;
  explorer_home_url: string | null;
  explorer_name: string | null;
  explorer_urls: string[] | null;
  rpc_url_internal: string | null;
  rpc_url_public: string[] | null;
  supports_trading: boolean;
  supports_sending: boolean;
  supports_bridging: boolean;
  supports_actions: boolean;
  supports_nft_positions: boolean;
  supports_positions: boolean;
  supports_sponsored_transactions: boolean;
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

  // deprecated territory, use this only at your own risk
  /** @deprecated */
  evm_id?: number | null;
  /** @deprecated */
  node_urls?: string[];
  /** @deprecated */
  base_asset_id?: string;
  /** @deprecated */
  block_explorer_urls?: string[];
  /** @deprecated */
  chain: string;
  /** @deprecated */
  external_id: string;
  /** @deprecated */
  supports_bridge: boolean;
};
