import { isTruthy } from 'is-truthy-ts';
import { invariant } from 'src/shared/invariant';
import type { ChainExplorer } from 'src/modules/zerion-api/types/ChainFullInfo';
import type { AddEthereumChainParameter } from '../ethereum/types/AddEthereumChainParameter';
import { toCustomNetworkId } from '../ethereum/chains/helpers';
import type { NetworkInfo } from './NetworkInfo';
import { getBaseAssetImplementation } from './NetworkInfo';
import { Networks } from './Networks';

/**
 * A dApp only tells us the explorer's home URL. Etherscan- and Blockscout-style
 * explorers share the `/tx`, `/address` and `/token` paths, so the templates are
 * derived from it, which keeps {NetworkInfo.explorer} identical to {ChainExplorer}.
 */
export function synthesizeExplorer(homeUrl: string): ChainExplorer {
  const home = homeUrl.replace(/\/+$/, '');
  let name = home;
  try {
    name = new URL(home).hostname;
  } catch {
    // keep the raw value as the name
  }
  return {
    name,
    homeUrl: home,
    txUrl: `${home}/tx/{HASH}`,
    addressUrl: `${home}/address/{ADDRESS}`,
    tokenUrl: `${home}/token/{ADDRESS}`,
  };
}

/**
 * Synthesizes a {NetworkInfo} for a chain ZPI does not return, from the
 * parameter a dApp or the user provided. Everything the backend would know
 * (Zerion RPC, capability flags, asset id) has no honest value: the RPC we use
 * internally for such a chain *is* the user's, only sending is supported, and
 * the base-asset id is the lowercased symbol.
 */
export function toNetworkInfo(
  value: AddEthereumChainParameter,
  maybeId: string | null
): NetworkInfo {
  invariant(value.rpcUrls, 'RPC URL should be defined in network config');
  invariant(value.chainId, 'chainId should be defined in network config');
  const id = maybeId ?? toCustomNetworkId(value.chainId);
  const rpcUrl = value.rpcUrls[0] ?? '';
  const explorerHome = value.blockExplorerUrls?.[0];
  const symbol = value.nativeCurrency?.symbol ?? '';
  return {
    id,
    name: value.chainName,
    iconUrl: value.iconUrls?.[0] || null,
    testnet: Boolean(value.is_testnet),
    specification: { eip155: { chainId: Number(value.chainId) } },
    explorer: explorerHome ? synthesizeExplorer(explorerHome) : null,
    baseAsset: {
      id: symbol.toLowerCase(),
      name: value.nativeCurrency?.name,
      symbol,
      iconUrl: null,
      implementations: {
        [id]: { address: null, decimals: value.nativeCurrency?.decimals },
      },
    },
    flags: {
      supportsSending: true,
      supportsTrading: false,
      supportsBridging: false,
      supportsActions: false,
      supportsNftPositions: false,
      supportsPositions: false,
      supportsSponsoredTransactions: false,
      supportsGasPrices: false,
      supportsSimulations: false,
    },
    rpcUrl,
    publicRpcUrl: rpcUrl,
    rpcUrlUser: rpcUrl,
    hidden: value.hidden,
  };
}

export function toAddEthereumChainParameter(
  item: NetworkInfo
): AddEthereumChainParameter {
  const implementation = getBaseAssetImplementation(item);
  const rpcUrl = item.rpcUrlUser || item.rpcUrl || item.publicRpcUrl;
  return {
    rpcUrls: rpcUrl ? [rpcUrl] : [],
    nativeCurrency: {
      symbol: item.baseAsset?.symbol || '<unknown>',
      decimals: (implementation?.decimals || NaN) as 18,
      name: item.baseAsset?.name || '<unknown>',
    },
    chainId: Networks.getChainId(item),
    chainName: item.name,
    blockExplorerUrls: item.explorer?.homeUrl ? [item.explorer.homeUrl] : [],
    iconUrls: [item.iconUrl].filter(isTruthy),
    hidden: item.hidden,
    is_testnet: item.testnet,
  };
}
