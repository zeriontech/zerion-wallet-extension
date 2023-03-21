import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';

export const createEmptyNetwork = (): Omit<NetworkConfig, 'chain'> & {
  chain: null;
} => ({
  chain: null,
  external_id: '',
  explorer_address_url: '',
  explorer_home_url: null,
  explorer_name: null,
  explorer_token_url: null,
  explorer_tx_url: null,
  icon_url: '',
  name: '',
  native_asset: {
    name: '',
    address: null,
    decimals: 18,
    id: '',
    symbol: '',
  },
  rpc_url_internal: null,
  rpc_url_public: null,
  supports_bridge: false,
  supports_sending: true,
  supports_trading: false,
  wrapped_native_asset: null,
});
