import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { NetworkConfigMetaData } from 'src/modules/networks/Networks';
import { PersistentStore } from 'src/modules/persistent-store';
import { invariant } from 'src/shared/invariant';
import { upsert } from 'src/shared/upsert';

export interface EthereumChainConfig extends NetworkConfigMetaData {
  value: NetworkConfig;
}

export interface ChainConfig {
  ethereumChains: EthereumChainConfig[];
}

function remove<T>(arr: T[], predicate: (item: T) => boolean) {
  const pos = arr.findIndex(predicate);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

export class ChainConfigStore extends PersistentStore<ChainConfig> {
  static initialState: ChainConfig = { ethereumChains: [] };

  addEthereumChain(
    value: NetworkConfig,
    { origin }: { origin: string }
  ): EthereumChainConfig {
    invariant(value.chain, 'chain property is required for NetworkConfig');
    const state = this.getState();
    const existingItems = new Map(
      state.ethereumChains.map((config) => [config.value.chain, config])
    );
    const chainId = value.external_id; // ethers.utils.hexValue(value.chainId);
    const existingEntry = existingItems.get(chainId);
    const now = Date.now();
    const newEntry = {
      origin,
      created: existingEntry ? existingEntry.created : now,
      updated: now,
      value,
    };
    if (
      existingEntry &&
      existingEntry.origin === newEntry.origin &&
      equal(existingEntry.value, newEntry.value)
    ) {
      return existingEntry;
    }
    const newState = produce(state, (draft) => {
      upsert(draft.ethereumChains, newEntry, (x) => x.value.chain);
    });
    this.setState(newState);
    return newEntry;
  }

  updateEthereumChain(value: NetworkConfig, { origin }: { origin: string }) {
    const state = this.getState();
    const chainIndex = state.ethereumChains.findIndex(
      (item) => value.external_id === item.value.external_id
    );
    if (chainIndex === -1) {
      throw new Error(
        `Network with external_id = ${value.external_id} doesn't exist`
      );
    }
    const newState = produce(state, (draft) => {
      const chain = draft.ethereumChains[chainIndex];
      chain.value = value;
      chain.origin = origin;
      chain.updated = Date.now();
    });
    this.setState(newState);
  }

  removeEthereumChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        remove(draft.ethereumChains, (x) => x.value.chain === chainStr);
      })
    );
  }
}

export const chainConfigStore = new ChainConfigStore(
  ChainConfigStore.initialState,
  'chain-configs'
);
