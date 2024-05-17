import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import { PersistentStore } from 'src/modules/persistent-store';
import { upsert } from 'src/shared/upsert';
import { getNetworkByChainId } from 'src/modules/networks/networks-api';
import { upgradeRecord } from 'src/shared/type-utils/versions';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { isCustomNetworkId } from './helpers';
import type { ChainConfig, EthereumChainConfig } from './types';
import { upgrades } from './versions';
import { BACKEND_NETWORK_ORIGIN } from './constants';

function remove<T>(arr: T[], predicate: (item: T) => boolean) {
  const pos = arr.findIndex(predicate);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

function updateChainOrigin(origin: string, prevOrigin: string | null) {
  if (
    prevOrigin &&
    prevOrigin !== BACKEND_NETWORK_ORIGIN &&
    prevOrigin !== INTERNAL_ORIGIN
  ) {
    return prevOrigin;
  }
  return origin;
}

class ChainConfigStore extends PersistentStore<ChainConfig> {
  static initialState: ChainConfig = {
    version: 2,
    ethereumChainConfigs: [],
  };

  constructor(initialState: ChainConfig, key: string) {
    super(initialState, key, {
      retrieve: async (key) => {
        const saved = await PersistentStore.readSavedState<ChainConfig>(key);
        if (saved) {
          return upgradeRecord(saved, upgrades);
        }
      },
    });
    this.ready().then(() => {
      this.checkChainsForUpdates();
    });
  }

  addEthereumChain(
    value: AddEthereumChainParameter,
    {
      origin,
      id,
      prevId: maybePrevId,
    }: {
      origin: string;
      id: string;
      prevId: string | null;
    }
  ): EthereumChainConfig {
    const prevId = maybePrevId || id;
    const state = this.getState();
    const existingItems = new Map(
      state.ethereumChainConfigs.map((config) => [config.id, config])
    );
    const existingEntry = existingItems.get(prevId);
    const existingPreviousIds = existingEntry?.previousIds || null;
    const previousIds =
      prevId !== id && !existingPreviousIds?.includes(prevId)
        ? [...(existingPreviousIds || []), prevId]
        : existingPreviousIds;
    const now = Date.now();
    const newEntry: EthereumChainConfig = {
      origin: updateChainOrigin(origin, existingEntry?.origin || null),
      created: existingEntry?.created ?? now,
      updated: now,
      value,
      id,
      previousIds,
    };
    if (
      existingEntry?.origin === newEntry.origin &&
      equal(existingEntry.value, newEntry.value)
    ) {
      return existingEntry;
    }
    const newState = produce(state, (draft) => {
      upsert(draft.ethereumChainConfigs, newEntry, (x) =>
        x.id === prevId ? id : x.id
      );
    });
    this.setState(newState);
    return newEntry;
  }

  removeEthereumChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        remove(draft.ethereumChainConfigs, (x) => x.id === chainStr);
      })
    );
  }

  private async checkChainsForUpdates() {
    const { ethereumChainConfigs } = this.getState();
    if (ethereumChainConfigs.length) {
      const updatedEthereumChainConfigs: EthereumChainConfig[] = [];
      for (const config of ethereumChainConfigs) {
        if (!isCustomNetworkId(config.id)) {
          updatedEthereumChainConfigs.push(config);
          continue;
        }
        try {
          const network = await getNetworkByChainId(config.value.chainId);
          if (!network) {
            throw new Error(
              `Unable to fetch network info by chainId: ${config.value.chainId}`
            );
          }
          updatedEthereumChainConfigs.push({ ...config, id: network.id });
        } catch {
          updatedEthereumChainConfigs.push(config);
        }
      }
      this.setState((current) => ({
        ...current,
        ethereumChainConfigs: updatedEthereumChainConfigs,
      }));
    }
  }
}

export const chainConfigStore = new ChainConfigStore(
  ChainConfigStore.initialState,
  'chain-configs'
);
