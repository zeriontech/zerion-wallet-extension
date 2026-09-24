import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import { PersistentStore } from 'src/modules/persistent-store';
import { upsert } from 'src/shared/upsert';
import type { NetworksApiParams } from 'src/modules/networks/networks-api';
import { getNetworkByChainId } from 'src/modules/networks/networks-api';
import { upgradeRecord } from 'src/shared/type-utils/versions';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { isCustomNetworkId, remapPinnedChains } from './helpers';
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

  private networksApiParams: NetworksApiParams | null = null;

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
        if (draft.pinnedChains) {
          remove(draft.pinnedChains, (x) => x === chainStr);
        }
      })
    );
  }

  pinChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        if (!draft.pinnedChains) {
          draft.pinnedChains = [];
        }
        upsert(draft.pinnedChains, chainStr, (x) => x);
      })
    );
  }

  unpinChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        if (draft.pinnedChains) {
          remove(draft.pinnedChains, (x) => x === chainStr);
        }
      })
    );
  }

  setPinnedChains(chains: string[]) {
    this.setState((state) => ({
      ...state,
      pinnedChains: Array.from(new Set(chains)),
    }));
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
      if (prevId !== id) {
        draft.pinnedChains = remapPinnedChains(
          draft.pinnedChains,
          new Map([[prevId, id]])
        );
      }
    });
    this.setState(newState);
    return newEntry;
  }

  removeEthereumChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        remove(draft.ethereumChainConfigs, (x) => x.id === chainStr);
        // Resetting a backend network keeps its pin, deleting a custom one drops it
        if (isCustomNetworkId(chainStr) && draft.pinnedChains) {
          remove(draft.pinnedChains, (x) => x === chainStr);
        }
      })
    );
    // known networks should be kept in the `other networks` list after removing the config
    this.addVisitedChain(chain);
  }

  setNetworksApiParams(params: NetworksApiParams) {
    const prevSource = this.networksApiParams?.source;
    this.networksApiParams = params;
    if (prevSource !== params.source) {
      this.checkChainsForUpdates();
    }
  }

  private async checkChainsForUpdates() {
    const { ethereumChainConfigs } = this.getState();
    if (ethereumChainConfigs.length) {
      const updatedEthereumChainConfigs: EthereumChainConfig[] = [];
      const idMap = new Map<string, string>();
      for (const config of ethereumChainConfigs) {
        if (!this.networksApiParams || !isCustomNetworkId(config.id)) {
          updatedEthereumChainConfigs.push(config);
          continue;
        }
        try {
          const { chainId } = config.value;
          const network = await getNetworkByChainId(
            chainId,
            this.networksApiParams
          );
          if (!network) {
            throw new Error(
              `Unable to fetch network info by chainId: ${config.value.chainId}`
            );
          }
          // Remove user-defined is_testnet when network becomes backend-supported
          const { is_testnet, ...valueWithoutTestnet } = config.value;
          if (network.id !== config.id) {
            idMap.set(config.id, network.id);
          }
          updatedEthereumChainConfigs.push({
            ...config,
            id: network.id,
            value: valueWithoutTestnet,
          });
        } catch {
          updatedEthereumChainConfigs.push(config);
        }
      }
      this.setState((current) => ({
        ...current,
        ethereumChainConfigs: updatedEthereumChainConfigs,
        pinnedChains: remapPinnedChains(current.pinnedChains, idMap),
      }));
    }
  }
}

export const chainConfigStore = new ChainConfigStore(
  ChainConfigStore.initialState,
  'chain-configs'
);
