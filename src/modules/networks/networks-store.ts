import { Store } from 'store-unit';
import { invariant } from 'src/shared/invariant';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import type { ChainId } from '../ethereum/transactions/ChainId';
import { isCustomNetworkId } from '../ethereum/chains/helpers';
import type { EthereumChainConfig } from '../ethereum/chains/types';
import { Networks } from './Networks';
import {
  getNetworkByChainId,
  getNetworkById,
  getSupportedNetworks,
} from './networks-api';
import type { NetworkInfo } from './NetworkInfo';
import { toNetworkInfo } from './helpers';
import { createChain } from './Chain';

interface State {
  networks: Networks | null;
}

function mergeNetworkInfos(
  prevConfigs: NetworkInfo[],
  nextConfigs: NetworkInfo[]
) {
  const nextConfigMap = Object.fromEntries(
    nextConfigs.map((config) => [config.id, config])
  );
  const prevConfigsSet = new Set(prevConfigs.map((item) => item.id));
  return [
    ...prevConfigs.map((config) => nextConfigMap[config.id] ?? config),
    ...nextConfigs.filter((config) => !prevConfigsSet.has(config.id)),
  ];
}

type OtherNetworkData = {
  ethereumChainConfigs: EthereumChainConfig[];
  visitedChains: string[] | null;
  pinnedChains: string[] | null;
};

export class NetworksStore extends Store<State> {
  private isReady = false;
  private networkConfigs: NetworkInfo[] = [];
  private customNetworkConfigs: NetworkInfo[] = [];
  private loaderPromises: Record<string, Promise<Networks>> = {};
  /**
   * Lazy on purpose: the ZerionAPI modules sit in import cycles with the
   * background/UI entry points, so the binding must not be read at module load.
   */
  private getApiClient: () => ZerionApiClient;
  source: NetworksSource;
  private getOtherNetworkData:
    | null
    | (() => Promise<OtherNetworkData | undefined>);

  constructor(
    state: State,
    {
      getOtherNetworkData,
      getApiClient,
      source,
    }: {
      getOtherNetworkData?: NetworksStore['getOtherNetworkData'];
      getApiClient: () => ZerionApiClient;
      source: NetworksSource;
    }
  ) {
    super(state);
    this.getOtherNetworkData = getOtherNetworkData ?? null;
    this.getApiClient = getApiClient;
    this.source = source;
  }

  get apiClient() {
    return this.getApiClient();
  }

  toString() {
    return this.source;
  }

  private async updateNetworks() {
    const chainConfigs = await this.getOtherNetworkData?.();
    const savedChainConfigs = chainConfigs?.ethereumChainConfigs;
    const visitedChains = chainConfigs?.visitedChains;
    const pinnedChains = chainConfigs?.pinnedChains;
    const networks = new Networks({
      networks: mergeNetworkInfos(
        this.networkConfigs,
        this.customNetworkConfigs
      ),
      ethereumChainConfigs: savedChainConfigs || [],
      visitedChains: visitedChains || [],
      pinnedChains: pinnedChains || [],
    });
    this.setState({ networks });
    return networks;
  }

  private async fetchNetworks({
    chains = [],
    update,
  }: {
    chains?: string[];
    update?: boolean;
  }) {
    const existingNetworksCollection =
      this.getState().networks?.getNetworksCollection();
    const shouldUpdateNetworksInfo =
      update || chains.some((id) => !existingNetworksCollection?.[id]);
    const existingNetworks = this.getState().networks;
    if (!shouldUpdateNetworksInfo && existingNetworks) {
      return existingNetworks;
    }

    const chainConfigs = await this.getOtherNetworkData?.();
    const savedChainConfigs = chainConfigs?.ethereumChainConfigs || [];
    const visitedChains = chainConfigs?.visitedChains || [];
    const pinnedChains = chainConfigs?.pinnedChains || [];
    const params = { apiClient: this.apiClient, source: this.source };

    const commonNetworkConfigs = update
      ? []
      : await getSupportedNetworks(params).catch(() => [] as NetworkInfo[]);
    const knownNetworkConfigs = mergeNetworkInfos(
      this.networkConfigs,
      commonNetworkConfigs
    );
    const knownIdSet = new Set(knownNetworkConfigs.map(({ id }) => id));

    /**
     * chain/list/v1 has no `ids` param, so chains outside the supported list
     * are looked up one by one: saved configs by their exact eip155 chainId,
     * requested, visited and pinned slugs through an exact-match search.
     */
    const savedConfigsToFetch = savedChainConfigs.filter(
      (config) => !isCustomNetworkId(config.id) && !knownIdSet.has(config.id)
    );
    const savedIdsToFetch = new Set(savedConfigsToFetch.map(({ id }) => id));
    const slugsToFetch = Array.from(
      new Set([...chains, ...visitedChains, ...pinnedChains])
    ).filter(
      (id) =>
        !isCustomNetworkId(id) &&
        !knownIdSet.has(id) &&
        !savedIdsToFetch.has(id)
    );
    const extraResults = await Promise.allSettled([
      ...savedConfigsToFetch.map((config) =>
        getNetworkByChainId(config.value.chainId, params)
      ),
      ...slugsToFetch.map((id) => getNetworkById(id, params)),
    ]);
    const extraNetworkConfigs = extraResults.flatMap((result) =>
      result.status === 'fulfilled' && result.value ? [result.value] : []
    );

    this.networkConfigs = mergeNetworkInfos(
      knownNetworkConfigs,
      extraNetworkConfigs
    );
    const fulfilledNetworkIdSet = new Set(
      this.networkConfigs.map(({ id }) => id)
    );
    this.customNetworkConfigs = savedChainConfigs
      .filter((config) => !fulfilledNetworkIdSet.has(config.id))
      .map((config) => toNetworkInfo(config.value, config.id));

    return this.updateNetworks();
  }

  async #fetchNetworkByChainId(chainId: ChainId) {
    if (!this.isReady) {
      await this.load();
    }
    const shouldUpdateNetworksInfo = this.getState()
      .networks?.getEvmNetworks()
      .every((network) => Networks.getChainId(network) !== chainId);
    const existingNetworks = this.getState().networks;
    if (!shouldUpdateNetworksInfo && existingNetworks) {
      return existingNetworks;
    }
    const network = await getNetworkByChainId(chainId, {
      apiClient: this.apiClient,
      source: this.source,
    });
    if (network) {
      this.networkConfigs = mergeNetworkInfos(this.networkConfigs, [network]);
    }
    return this.updateNetworks();
  }

  async pushConfigs(...extraNetworkConfigs: NetworkInfo[]) {
    this.networkConfigs = mergeNetworkInfos(
      this.networkConfigs,
      extraNetworkConfigs
    );
    return this.updateNetworks();
  }

  async load({ chains }: { chains?: string[] } = {}) {
    const key = JSON.stringify(chains || []);
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworks({ chains }).finally(() => {
        delete this.loaderPromises[key];
        this.isReady = true;
      });
    }
    return this.loaderPromises[key];
  }

  async fetchNetworkById(id: string): Promise<NetworkInfo> {
    const networks = await this.load({ chains: [id] });
    const network = networks.getByNetworkId(createChain(id));
    invariant(network, `Could not load network for id: ${id}`);
    return network;
  }

  async loadNetworksByChainId(chainId: ChainId) {
    const key = `chainId-${chainId}`;
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.#fetchNetworkByChainId(chainId).finally(
        () => {
          delete this.loaderPromises[key];
        }
      );
    }
    return this.loaderPromises[key];
  }

  async fetchNetworkByChainId(chainId: ChainId): Promise<NetworkInfo> {
    const networks = await this.loadNetworksByChainId(chainId);
    const network = networks.getNetworkById(chainId);
    invariant(network, `Could not load network for chainId: ${chainId}`);
    return network;
  }

  async update() {
    const key = 'update';
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworks({ update: true }).finally(
        () => {
          delete this.loaderPromises[key];
        }
      );
    }
    return this.loaderPromises[key];
  }
}
