import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import { PersistentStore } from 'src/modules/persistent-store';
import { upsert } from 'src/shared/upsert';
import { getNetworkByChainId } from 'src/modules/networks/networks-api';
import { upgradeRecord } from 'src/shared/type-utils/versions';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { isCustomNetworkId } from './helpers';
import type { ChainConfig, EthereumChainConfig } from './types';
import { upgrades } from './versions';

function remove<T>(arr: T[], predicate: (item: T) => boolean) {
  const pos = arr.findIndex(predicate);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

class ChainConfigStore extends PersistentStore<ChainConfig> {
  static initialState: ChainConfig = {
    version: 2,
    ethereumChainConfigs: [],
  };

  async restore() {
    const saved = await PersistentStore.readSavedState<ChainConfig>(this.key);
    if (saved) {
      this.setState(upgradeRecord(saved, upgrades));
    }
    this.isReady = true;
    this.checkChainsForUpdates();
  }

  readyPromise = this.restore();

  addEthereumChain(
    value: AddEthereumChainParameter,
    {
      origin,
      id,
      created,
      prevId: maybePrevId,
    }: { origin: string; id: string; created?: number; prevId?: string }
  ): EthereumChainConfig {
    const prevId = maybePrevId || id;
    const state = this.getState();
    const existingItems = new Map(
      state.ethereumChainConfigs?.map((config) => [config.id, config])
    );
    const existingEntry = existingItems.get(prevId);
    const existingPreviousIds = existingEntry?.previousIds || [];
    const previousIds =
      prevId !== id && !existingPreviousIds.includes(prevId)
        ? [...existingPreviousIds, prevId]
        : existingPreviousIds;
    const now = Date.now();
    const newEntry: EthereumChainConfig = {
      origin,
      created: created ?? (existingEntry ? existingEntry.created : now),
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
      if (!draft.ethereumChainConfigs) {
        draft.ethereumChainConfigs = [];
      }
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
        if (!draft.ethereumChainConfigs) {
          draft.ethereumChainConfigs = [];
        }
        remove(draft.ethereumChainConfigs, (x) => x.id === chainStr);
      })
    );
  }

  private async checkChainsForUpdates() {
    const { ethereumChainConfigs } = this.getState();
    if (ethereumChainConfigs?.length) {
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

  async ready(): Promise<void> {
    return this.isReady ? Promise.resolve() : this.readyPromise;
  }
}

export const chainConfigStore = new ChainConfigStore(
  ChainConfigStore.initialState,
  'chain-configs'
);
