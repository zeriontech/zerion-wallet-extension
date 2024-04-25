import { produce } from 'immer';
import { equal } from 'src/modules/fast-deep-equal';
import type { Chain } from 'src/modules/networks/Chain';
import type { NetworkConfigMetaData } from 'src/modules/networks/Networks';
import { PersistentStore } from 'src/modules/persistent-store';
import { upsert } from 'src/shared/upsert';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { toAddEthereumChainParamer } from 'src/modules/networks/helpers';
import { getNetworkByChainId } from 'src/modules/networks/networks-api';
import type { Wallet } from 'src/background/Wallet/Wallet';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { invariant } from 'src/shared/invariant';
import type { AddEthereumChainParameter } from '../types/AddEthereumChainParameter';
import { toCustomNetworkId, isCustomNetworkId } from './helpers';

function maybeLocalChainId(id?: string | null) {
  return id?.length === 21; // nanoid() standard length
}

export interface EthereumChainConfig extends NetworkConfigMetaData {
  value: AddEthereumChainParameter;
  id: string;
}

interface ChainConfig {
  ethereumChainConfigs?: EthereumChainConfig[];
  migratedChainConfigs?: boolean;
  // we should remove deprecated chainIds from origin permissions
  migratedPermissions?: boolean;
  /** @deprecated */
  ethereumChains?: (NetworkConfigMetaData & { value: NetworkConfig })[];
}

function remove<T>(arr: T[], predicate: (item: T) => boolean) {
  const pos = arr.findIndex(predicate);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

export class ChainConfigStore extends PersistentStore<ChainConfig> {
  static initialState: ChainConfig = {
    ethereumChainConfigs: [],
    migratedChainConfigs: false,
    migratedPermissions: false,
  };

  addEthereumChain(
    value: AddEthereumChainParameter,
    { origin, id, created }: { origin: string; id: string; created?: number }
  ): EthereumChainConfig {
    const state = this.getState();
    const existingItems = new Map(
      state.ethereumChainConfigs?.map((config) => [config.id, config])
    );
    const existingEntry = existingItems.get(id);
    const now = Date.now();
    const newEntry = {
      origin,
      created: created ?? (existingEntry ? existingEntry.created : now),
      updated: now,
      value,
      id,
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
      upsert(draft.ethereumChainConfigs, newEntry, (x) => x.id);
    });
    this.setState(newState);
    return newEntry;
  }

  removeEthereumChain(chain: Chain) {
    const chainStr = chain.toString();
    this.setState((state) =>
      produce(state, (draft) => {
        if (draft.ethereumChains) {
          remove(draft.ethereumChains, (x) => x.value.chain === chainStr);
        }
        if (!draft.ethereumChainConfigs) {
          draft.ethereumChainConfigs = [];
        }
        remove(draft.ethereumChainConfigs, (x) => x.id === chainStr);
      })
    );
  }

  private async migrateOldConfigs() {
    const {
      migratedChainConfigs,
      ethereumChainConfigs = [],
      ethereumChains,
    } = this.getState();
    if (migratedChainConfigs || !ethereumChains) {
      return;
    }
    const existingIdSet = new Set(ethereumChainConfigs?.map(({ id }) => id));
    for (const { value, ...config } of ethereumChains) {
      const chainConfig = toAddEthereumChainParamer(value);
      let id = !maybeLocalChainId(value.chain) ? value.chain : null;
      if (!id) {
        const chainId = value.external_id;
        try {
          const network = await getNetworkByChainId(chainId);
          invariant(
            network,
            `Unable to fetch network info by chainId: ${chainId}`
          );
          id = network.id;
        } catch {
          id = toCustomNetworkId(chainId);
        }
      }
      if (!existingIdSet.has(id)) {
        ethereumChainConfigs?.push({
          ...config,
          value: chainConfig,
          id,
        });
      }
    }
    this.setState((current) => ({
      ...current,
      migratedChainConfigs: true,
      ethereumChainConfigs,
    }));
  }

  async ready() {
    await super.ready();
    await this.migrateOldConfigs();
  }

  async cleanupDeprecatedCustomChainPermissions(wallet: Wallet) {
    await this.ready();
    const {
      ethereumChains: oldChainConfigs,
      ethereumChainConfigs: newChainConfigs,
      migratedPermissions,
    } = this.getState();
    if (migratedPermissions || !oldChainConfigs) {
      return;
    }
    const updatedChainIdSet = new Set(newChainConfigs?.map(({ id }) => id));
    for (const config of oldChainConfigs) {
      const prevChain = config.value.chain;
      if (!updatedChainIdSet.has(prevChain)) {
        await wallet.switchChainPermissions({
          context: { origin: INTERNAL_ORIGIN },
          params: { prevChain },
        });
      }
    }
    this.setState((current) => ({ ...current, migratedPermissions: true }));
  }

  async checkChainsForUpdates(wallet: Wallet) {
    await this.ready();
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
          invariant(
            network,
            `Unable to fetch network info by chainId: ${config.value.chainId}`
          );
          updatedEthereumChainConfigs.push({ ...config, id: network.id });
          await wallet.switchChainPermissions({
            context: { origin: INTERNAL_ORIGIN },
            params: { prevChain: config.id, chain: network.id },
          });
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
