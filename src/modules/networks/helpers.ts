import { invariant } from 'src/shared/invariant';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import { getCustomNetworkId } from '../ethereum/chains/helpers';
import type { NetworkConfig } from './NetworkConfig';

export function getChainId(network: NetworkConfig) {
  return network.standard === 'eip155'
    ? normalizeChainId(network.specification.eip155.id)
    : null;
}

export function toNetworkConfig(
  value: AddEthereumChainParameter
): NetworkConfig {
  invariant(value.rpcUrls, 'RPC URL should be defined in network config');
  invariant(value.chainId, 'chainId should be defined in network config');
  const id = getCustomNetworkId(value.chainId);
  return {
    supports_sending: true,
    supports_trading: false,
    supports_bridge: false,
    supports_bridging: false,
    supports_actions: false,
    supports_nft_positions: false,
    supports_positions: false,
    name: value.chainName,
    external_id: value.chainId,
    id,
    chain: id,
    explorer_home_url: value.blockExplorerUrls?.[0] || null,
    explorer_address_url: null,
    explorer_name: null,
    explorer_token_url: null,
    explorer_tx_url: null,
    explorer_urls: null,
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
    standard: 'eip155',
    specification: {
      eip155: {
        eip1559: false,
        id: Number(value.chainId),
      },
    },
  };
}

export function injectChainConfig(
  networkConfig: NetworkConfig,
  chainConfig?: AddEthereumChainParameter
): NetworkConfig {
  if (!chainConfig) {
    return networkConfig;
  }
  return {
    ...networkConfig,
    name: chainConfig.chainName,
    explorer_home_url:
      chainConfig.blockExplorerUrls?.[0] ||
      networkConfig.explorer_home_url ||
      null,
    icon_url: chainConfig.iconUrls?.[0] || networkConfig.icon_url || '',
    rpc_url_public: chainConfig.rpcUrls,
    rpc_url_user: chainConfig.rpcUrls[0],
    native_asset: {
      name: chainConfig.nativeCurrency?.name,
      address: networkConfig.native_asset?.address || null,
      decimals: chainConfig.nativeCurrency?.decimals,
      symbol: chainConfig.nativeCurrency?.symbol,
      id:
        chainConfig.nativeCurrency?.symbol?.toLowerCase() === 'eth'
          ? 'eth'
          : null,
    },
    hidden: chainConfig.hidden ?? networkConfig.hidden,
  };
}

export function toAddEthereumChainParamer(
  item: NetworkConfig
): AddEthereumChainParameter {
  return {
    rpcUrls: item.rpc_url_user
      ? [item.rpc_url_user]
      : item.rpc_url_internal
      ? [item.rpc_url_internal]
      : item.rpc_url_public?.length
      ? item.rpc_url_public
      : [],
    nativeCurrency: {
      symbol: item.native_asset?.symbol || '<unknown>',
      decimals: (item.native_asset?.decimals || NaN) as 18,
      name: item.native_asset?.name || '<unknown>',
    },
    // deprecated field is being used for chainConfigStore's migration
    chainId: getChainId(item) || item.external_id || '',
    chainName: item.name,
    blockExplorerUrls: item.explorer_address_url
      ? [item.explorer_address_url]
      : [],
    iconUrls: [item.icon_url],
    hidden: item.hidden,
  };
}
