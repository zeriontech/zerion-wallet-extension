import { ethers } from 'ethers';
import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import { PersistentStore } from 'src/modules/persistent-store';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';

export interface EthereumChainConfig {
  created: number;
  updated: number;
  origin: string;
  chain: AddEthereumChainParameter;
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
    value: AddEthereumChainParameter,
    origin: string
  ): EthereumChainConfig {
    const state = this.getState();
    const existingItems = new Map(
      state.ethereumChains.map((chain) => [chain.chain.chainId, chain])
    );
    const chainId = ethers.utils.hexValue(value.chainId);
    const existing = existingItems.get(chainId);
    const now = Date.now();
    const newValue = {
      origin,
      created: existing ? existing.created : now,
      updated: now,
      chain: { ...value, chainId },
    };
    if (
      existing &&
      existing.origin === newValue.origin &&
      equal(existing.chain, newValue.chain)
    ) {
      return existing;
    }
    const newState = produce(state, (draft) => {
      remove(draft.ethereumChains, (x) => x.chain.chainId === chainId);
      draft.ethereumChains.push(newValue);
    });
    this.setState(newState);
    return newValue;
  }

  removeEthereumChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        remove(draft.ethereumChains, (x) => x.chain.chainId === chainStr);
      })
    );
  }
}

export const chainConfigStore = new ChainConfigStore(
  ChainConfigStore.initialState,
  'chain-configs'
);
