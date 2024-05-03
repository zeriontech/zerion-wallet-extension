import type { Upgrades } from 'src/shared/type-utils/versions';
import { toAddEthereumChainParameter } from 'src/modules/networks/helpers';
import type { ChainConfig, ChainConfigV1, EthereumChainConfig } from './types';
import { toCustomNetworkId } from './helpers';

type PossibleEntry = ChainConfigV1 | ChainConfig;

function maybeLocalChainId(id?: string | null) {
  return id?.length === 21; // nanoid() standard length
}

export const upgrades: Upgrades<PossibleEntry> = {
  2: (entry) => {
    const ethereumChainConfigs: EthereumChainConfig[] = [];
    for (const { value, ...config } of entry.ethereumChains || []) {
      const chainConfig = toAddEthereumChainParameter(value);
      const id = maybeLocalChainId(value.chain)
        ? toCustomNetworkId(value.external_id)
        : value.chain;
      ethereumChainConfigs?.push({
        ...config,
        id,
        value: chainConfig,
        previousIds: [value.chain],
      });
    }
    return {
      version: 2,
      ethereumChainConfigs,
      ethereumChains: entry.ethereumChains,
    };
  },
};
