import type { Upgrades } from 'src/shared/type-utils/versions';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import type {
  ChainConfig,
  ChainConfigV1,
  ChainConfigV2,
  EthereumChainConfig,
} from './types';
import { toCustomNetworkId } from './helpers';

type PossibleEntry = ChainConfigV1 | ChainConfigV2 | ChainConfig;

function maybeLocalChainId(id?: string | null) {
  return !id || id.length === 21; // nanoid() standard length
}

/**
 * legacy version of toAddEthereumChainParameter from src/modules/networks/helpers.ts
 * supports old external_id field from NetworkConfigStoredV0
 */
export function toAddEthereumChainParameterLegacy(
  item: ChainConfigV1['ethereumChains'][number]['value']
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
    chainId: normalizeChainId(item.external_id),
    chainName: item.name,
    blockExplorerUrls: item.explorer_tx_url ? [item.explorer_tx_url] : [],
    iconUrls: [item.icon_url],
    hidden: item.hidden,
  };
}

export const upgrades: Upgrades<PossibleEntry> = {
  2: (entry) => {
    try {
      const ethereumChainConfigs: EthereumChainConfig[] = [];
      for (const { value, ...config } of entry.ethereumChains || []) {
        const chainConfig = toAddEthereumChainParameterLegacy(value);
        const id = maybeLocalChainId(value.id)
          ? toCustomNetworkId(value.external_id)
          : value.id;
        ethereumChainConfigs.push({
          ...config,
          id,
          value: chainConfig,
          previousIds: value.chain !== id ? [value.chain] : null,
        });
      }
      return {
        version: 2,
        ethereumChainConfigs,
        ethereumChains: entry.ethereumChains,
      };
    } catch {
      return {
        ...entry,
        version: 2,
        ethereumChainConfigs: [],
      };
    }
  },
  3: (entry) => {
    try {
      return {
        ...entry,
        version: 3,
        ethereumChainConfigs: entry.ethereumChainConfigs.map((config) => {
          if (config.id) {
            return config;
          }
          return { ...config, id: toCustomNetworkId(config.value.chainId) };
        }),
      };
    } catch {
      return {
        ...entry,
        version: 3,
        ethereumChainConfigs: [],
      };
    }
  },
};
