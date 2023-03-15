import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { PersistentStore } from 'src/modules/persistent-store';
import { invariant } from 'src/shared/invariant';
import { upsert } from 'src/shared/upsert';

export interface EthereumChainConfig {
  created: number;
  updated: number;
  origin: string;
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

  addEthereumChain(value: NetworkConfig, origin: string): EthereumChainConfig {
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
