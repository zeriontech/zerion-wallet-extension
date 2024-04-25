import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import type { NetworkConfig } from './NetworkConfig';

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
