import { produce } from 'immer';
import type { Client } from 'defi-sdk';
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
    version: 3,
    ethereumChainConfigs: [],
    visitedChains: [],
  };

  private defiSdkClient: Client | null = null;

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

  addVisitedChain(chain: Chain) {
    const chainStr = chain.toString();
    // we don't need to save custom ids in this list cause they are fully dependent on ethereumChainConfigs
    if (isCustomNetworkId(chainStr)) {
      return;
    }
    this.setState((state) =>
      produce(state, (draft) => {
        if (!draft.visitedChains) {
          draft.visitedChains = [];
        }
        upsert(draft.visitedChains, chainStr, (x) => x);
      })
    );
  }

  removeVisitedChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        if (!draft.visitedChains) {
          draft.visitedChains = [];
        }
        remove(draft.visitedChains, (x) => x === chainStr);
      })
    );
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
    // known networks should be kept in the `other networks` list after removing the config
    this.addVisitedChain(chain);
  }

  setDefiSdkClient(client: Client) {
    const prevClient = this.defiSdkClient;
    this.defiSdkClient = client;
    if (prevClient !== this.defiSdkClient) {
      this.checkChainsForUpdates();
    }
  }

  private async checkChainsForUpdates() {
    const { ethereumChainConfigs } = this.getState();
    if (ethereumChainConfigs.length) {
      const updatedEthereumChainConfigs: EthereumChainConfig[] = [];
      for (const config of ethereumChainConfigs) {
        if (!this.defiSdkClient || !isCustomNetworkId(config.id)) {
          updatedEthereumChainConfigs.push(config);
          continue;
        }
        try {
          const { chainId } = config.value;
          const client = this.defiSdkClient;
          const network = await getNetworkByChainId(chainId, client);
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
