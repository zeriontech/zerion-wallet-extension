import { nanoid } from 'nanoid';
import { invariant } from 'src/shared/invariant';
import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import type { NetworkConfig } from './NetworkConfig';
import type { Chain } from './Chain';

export function toNetworkConfig(
  value: AddEthereumChainParameter,
  chain: Chain | null
): NetworkConfig {
  invariant(value.rpcUrls, 'RPC URL should be defined in network config');
  invariant(value.chainId, 'chainId should be defined in network config');
  const id = chain?.toString() || nanoid();
  return {
    supports_sending: true,
    supports_trading: false,
    supports_bridge: false,
    name: value.chainName,
    external_id: value.chainId,
    id,
    chain: id,
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
      id: value.nativeCurrency?.symbol?.toLowerCase() === 'eth' ? 'eth' : '',
    },
    rpc_url_internal: null,
    rpc_url_public: value.rpcUrls,
    wrapped_native_asset: null,
  };
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
