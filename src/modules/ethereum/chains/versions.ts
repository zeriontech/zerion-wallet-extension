import type { Upgrades } from 'src/shared/type-utils/versions';
import { toAddEthereumChainParameter } from 'src/modules/networks/helpers';
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

export const upgrades: Upgrades<PossibleEntry> = {
  2: (entry) => {
    const ethereumChainConfigs: EthereumChainConfig[] = [];
    for (const { value, ...config } of entry.ethereumChains || []) {
      const chainConfig = toAddEthereumChainParameter(value);
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
  },
  3: (entry) => {
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
  },
};
