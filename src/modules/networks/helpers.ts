import type { ChainConfig } from '../ethereum/chains/ChainConfigStore';
import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import type { NetworkConfig } from './NetworkConfig';

export function toNetworkConfig(
  value: AddEthereumChainParameter
): NetworkConfig {
  return {
    supports_sending: true,
    supports_trading: false,
    supports_bridge: false,
    name: value.chainName,
    external_id: value.chainId,
    chain: value.chainId,
    explorer_home_url: value.blockExplorerUrls?.[0] || null,
    explorer_address_url: null,
    explorer_name: null,
    explorer_token_url: null,
    explorer_tx_url: null,
    icon_url: value.iconUrls?.[0] || '',
    native_asset: {
      name: value.nativeCurrency?.name,
      address: null,
      decimals: value.nativeCurrency?.decimals,
      symbol: value.nativeCurrency?.symbol,
      id: value.nativeCurrency?.symbol.toLowerCase() === 'eth' ? 'eth' : '',
    },
    rpc_url_internal: value.rpcUrls[0],
    rpc_url_public: value.rpcUrls,
    wrapped_native_asset: null,
  };
}

export function toNetworkConfigs(
  items: ChainConfig['ethereumChains']
): NetworkConfig[] {
  return items.map((item) => toNetworkConfig(item.chain));
}

export function toAddEthereumChainParamer(
  item: NetworkConfig
): AddEthereumChainParameter {
  return {
    rpcUrls: item.rpc_url_internal ? [item.rpc_url_internal] : [],
    nativeCurrency: {
      symbol: item.native_asset?.symbol || '<unknown>',
      decimals: (item.native_asset?.decimals || NaN) as 18,
      name: item.native_asset?.name || '<unknown>',
    },
    chainId: item.external_id,
    chainName: item.name,
    blockExplorerUrls: item.explorer_address_url
      ? [item.explorer_address_url]
      : [],
    iconUrls: [item.icon_url],
  };
}
