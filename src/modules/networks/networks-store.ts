import { Store } from 'store-unit';
import { type Client } from 'defi-sdk';
import type { ChainId } from '../ethereum/transactions/ChainId';
import { isCustomNetworkId } from '../ethereum/chains/helpers';
import type { EthereumChainConfig } from '../ethereum/chains/types';
import { Networks } from './Networks';
import { getNetworkByChainId, getNetworks } from './networks-api';
import type { NetworkConfig } from './NetworkConfig';
import { toNetworkConfig } from './helpers';

interface State {
  networks: Networks | null;
}

function mergeNetworkConfigs(
  prevConfigs: NetworkConfig[],
  nextConfigs: NetworkConfig[]
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
};

export class NetworksStore extends Store<State> {
  private networkConfigs: NetworkConfig[] = [];
  private customNetworkConfigs: NetworkConfig[] = [];
  private loaderPromises: Record<string, Promise<Networks>> = {};
  client: Client;
  testnetMode: boolean;
  private getOtherNetworkData:
    | null
    | (() => Promise<OtherNetworkData | undefined>);

  constructor(
    state: State,
    {
      getOtherNetworkData,
      client,
      testnetMode,
    }: {
      getOtherNetworkData?: NetworksStore['getOtherNetworkData'];
      client: Client;
      testnetMode: boolean;
    }
  ) {
    super(state);
    this.getOtherNetworkData = getOtherNetworkData ?? null;
    this.client = client;
    this.testnetMode = testnetMode;
  }

  toString() {
    return this.client.url;
  }

  private async updateNetworks() {
    const chainConfigs = await this.getOtherNetworkData?.();
    const savedChainConfigs = chainConfigs?.ethereumChainConfigs;
    const visitedChains = chainConfigs?.visitedChains;
    const networks = new Networks({
      networks: mergeNetworkConfigs(
        this.networkConfigs,
        this.customNetworkConfigs
      ),
      ethereumChainConfigs: savedChainConfigs || [],
      visitedChains: visitedChains || [],
    });
    this.setState({ networks });
    return networks;
  }

  private async fetchNetworks({
    chains = [],
    update,
    testnetMode,
  }: {
    chains?: string[];
    update?: boolean;
    testnetMode: boolean;
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
    const savedChainConfigs = chainConfigs?.ethereumChainConfigs;
    const visitedChains = chainConfigs?.visitedChains || [];
    const savedIds = savedChainConfigs?.map((config) => config.id) || [];
    const chainsToFetch = Array.from(
      new Set(
        [...savedIds, ...chains, ...visitedChains].filter(
          (id) => !isCustomNetworkId(id)
        )
      )
    );

    const [extraNetworkConfigs, commonNetworkConfigs] =
      await Promise.allSettled([
        getNetworks({
          ids: chainsToFetch,
          client: this.client,
          include_testnets: true,
          supported_only: false,
        }),
        update
          ? Promise.resolve([])
          : getNetworks({
              ids: null,
              client: this.client,
              include_testnets: testnetMode,
              supported_only: true,
            }),
      ]);

    const updatedNetworkConfigs = mergeNetworkConfigs(
      commonNetworkConfigs.status === 'fulfilled'
        ? commonNetworkConfigs.value
        : [],
      extraNetworkConfigs.status === 'fulfilled'
        ? extraNetworkConfigs.value
        : []
    );

    this.networkConfigs = mergeNetworkConfigs(
      this.networkConfigs,
      updatedNetworkConfigs
    );
    const fulfilledNetworkIdSet = new Set(
      this.networkConfigs.map(({ id }) => id)
    );
    this.customNetworkConfigs =
      savedChainConfigs
        ?.filter((config) => !fulfilledNetworkIdSet.has(config.id))
        .map((config) => toNetworkConfig(config.value, config.id)) || [];

    return this.updateNetworks();
  }

  private async fetchNetworkById(chainId: ChainId) {
    const shouldUpdateNetworksInfo = this.getState()
      .networks?.getNetworks()
      .every((network) => Networks.getChainId(network) !== chainId);
    const existingNetworks = this.getState().networks;
    if (!shouldUpdateNetworksInfo && existingNetworks) {
      return existingNetworks;
    }
    const network = await getNetworkByChainId(chainId, this.client);
    if (network) {
      this.networkConfigs = mergeNetworkConfigs(this.networkConfigs, [network]);
    }
    return this.updateNetworks();
  }

  async pushConfigs(...extraNetworkConfigs: NetworkConfig[]) {
    this.networkConfigs = mergeNetworkConfigs(
      this.networkConfigs,
      extraNetworkConfigs
    );
    return this.updateNetworks();
  }

  async load({ chains }: { chains?: string[] } = {}) {
    const key = JSON.stringify(chains || []);
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworks({
        chains,
        /**
         * NOTE: due to fetchNetworks implementation, {testnetMode} param is important only when
         * {chains} param is undefined. {testnetMode} param helps to fill networkStore initially for testnetMode
         */
        testnetMode: this.testnetMode,
      }).finally(() => {
        delete this.loaderPromises[key];
      });
    }
    return this.loaderPromises[key];
  }

  async loadNetworksByChainId(chainId: ChainId) {
    const key = `chainId-${chainId}`;
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworkById(chainId).finally(() => {
        delete this.loaderPromises[key];
      });
    }
    return this.loaderPromises[key];
  }

  async update() {
    const key = 'update';
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworks({
        update: true,
        /** testnetMode value does not matter when update: true ¯\_(ツ)_/¯ */
        testnetMode: this.testnetMode,
      }).finally(() => {
        delete this.loaderPromises[key];
      });
    }
    return this.loaderPromises[key];
  }
}
