import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import type { NetworkInfo } from './NetworkInfo';
import { getBaseAssetImplementation } from './NetworkInfo';
import { synthesizeExplorer } from './helpers';

/**
 * Applies a saved chain config (the dApp's or the user's edit) on top of a
 * {NetworkInfo}. Only what the form can edit is overridden: name, icon,
 * explorer home, the RPC URL, the base asset's display fields, `hidden` and the
 * testnet flag. Zerion's own `rpcUrl`, the `flags` and the backend base-asset
 * id and icon are kept.
 */
export function applyChainConfig(
  info: NetworkInfo,
  chainConfig: AddEthereumChainParameter | null
): NetworkInfo {
  if (!chainConfig) {
    return info;
  }
  const explorerHome = chainConfig.blockExplorerUrls?.[0];
  const rpcUrl = chainConfig.rpcUrls[0];
  const { nativeCurrency } = chainConfig;
  const implementation = getBaseAssetImplementation(info);
  return {
    ...info,
    name: chainConfig.chainName,
    iconUrl: chainConfig.iconUrls?.[0] || info.iconUrl || null,
    explorer: explorerHome
      ? info.explorer
        ? { ...info.explorer, homeUrl: explorerHome }
        : synthesizeExplorer(explorerHome)
      : info.explorer,
    publicRpcUrl: rpcUrl,
    rpcUrlUser: rpcUrl,
    baseAsset: {
      id: info.baseAsset?.id || nativeCurrency.symbol.toLowerCase(),
      name: nativeCurrency?.name,
      symbol: nativeCurrency.symbol,
      iconUrl: info.baseAsset?.iconUrl ?? null,
      implementations: {
        ...info.baseAsset?.implementations,
        [info.id]: {
          address: implementation?.address ?? null,
          decimals: nativeCurrency.decimals,
        },
      },
    },
    hidden: chainConfig.hidden ?? info.hidden,
    testnet: chainConfig.is_testnet ?? info.testnet,
  };
}
