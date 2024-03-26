import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkConfigMetaData } from 'src/modules/networks/Networks';
import { PersistentStore } from 'src/modules/persistent-store';
import { invariant } from 'src/shared/invariant';
import { upsert } from 'src/shared/upsert';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { toAddEthereumChainParamer } from 'src/modules/networks/helpers';
import { getNetworkByChainId } from 'src/modules/networks/networks-api';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { getCustomNetworkId } from './helpers';

export function maybeLocalChainId(id: string) {
  return id.length === 21; // nanoid() standard length
}

export interface EthereumChainConfig extends NetworkConfigMetaData {
  value: AddEthereumChainParameter;
  id: string;
}

interface EtherenumNetworkConfig extends NetworkConfigMetaData {
  value: NetworkConfig;
}

export interface ChainConfig {
  ethereumChainConfigs?: EthereumChainConfig[];
  migrated?: boolean;
  /** @deprecated */
  ethereumChains: EtherenumNetworkConfig[];
}

function remove<T>(arr: T[], predicate: (item: T) => boolean) {
  const pos = arr.findIndex(predicate);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

export class ChainConfigStore extends PersistentStore<ChainConfig> {
  static initialState: ChainConfig = {
    ethereumChains: [],
    ethereumChainConfigs: [],
    migrated: false,
  };

  addEthereumChain(
    value: AddEthereumChainParameter,
    { origin, id }: { origin: string; id: string }
  ): EthereumChainConfig {
    invariant(
      value.chainId,
      'chainId property is required for AddEthereumChainParameter'
    );
    const state = this.getState();
    const existingItems = new Map(
      state.ethereumChainConfigs?.map((config) => [
        config.value.chainId,
        config,
      ])
    );

    const existingEntry = existingItems.get(value.chainId);
    const now = Date.now();
    const newEntry = {
      origin,
      created: existingEntry ? existingEntry.created : now,
      updated: now,
      value,
      id,
    };
    if (
      existingEntry &&
      existingEntry.origin === newEntry.origin &&
      equal(existingEntry.value, newEntry.value)
    ) {
      return existingEntry;
    }
    const newState = produce(state, (draft) => {
      if (!draft.ethereumChainConfigs) {
        draft.ethereumChainConfigs = [];
      }
      upsert(draft.ethereumChainConfigs, newEntry, (x) => x.id);
    });
    this.setState(newState);
    return newEntry;
  }

  removeEthereumChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        remove(draft.ethereumChains, (x) => x.value.chain === chainStr);
        if (!draft.ethereumChainConfigs) {
          draft.ethereumChainConfigs = [];
        }
        remove(draft.ethereumChainConfigs, (x) => x.id === chainStr);
      })
    );
  }

  private async migrateOldConfigs() {
    const {
      migrated,
      ethereumChainConfigs = [],
      ethereumChains,
    } = this.getState();
    if (migrated) {
      return;
    }
    const existedIdSet = new Set(
      ethereumChainConfigs?.map((config) => config.id)
    );
    for (const networkConfig of ethereumChains) {
      const chainConfig = toAddEthereumChainParamer(networkConfig.value);
      let id =
        networkConfig.value.chain &&
        !maybeLocalChainId(networkConfig.value.chain)
          ? networkConfig.value.chain
          : null;
      if (!id) {
        try {
          const network = await getNetworkByChainId(
            parseInt(networkConfig.value.external_id)
          );
          if (!network) {
            throw new Error(
              `Unable to fetch network info by chain id: ${networkConfig.value.external_id}`
            );
          }
          id = network.id;
        } catch {
          id = getCustomNetworkId(networkConfig.value.external_id);
        }
      }
      if (!existedIdSet.has(id)) {
        ethereumChainConfigs?.push({
          ...networkConfig,
          value: chainConfig,
          id,
        });
      }
    }
    this.setState((current) => ({
      ...current,
      migrated: true,
      ethereumChainConfigs,
    }));
  }

  async ready() {
    await super.ready();
    await this.migrateOldConfigs();
  }
}

export const chainConfigStore = new ChainConfigStore(
  ChainConfigStore.initialState,
  'chain-configs'
);
