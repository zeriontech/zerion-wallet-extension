import { getChainId } from 'src/modules/networks/helpers';
import { Store } from 'store-unit';
import type { EthereumChainConfig } from '../ethereum/chains/ChainConfigStore';
import type { ChainId } from '../ethereum/transactions/ChainId';
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

export class NetworksStore extends Store<State> {
  private networkConfigs: NetworkConfig[] = [];
  private customNetworkConfigs: NetworkConfig[] = [];
  private loaderPromises: Record<string, Promise<Networks>> = {};
  private getEthereumChainConfigs:
    | null
    | (() => Promise<EthereumChainConfig[] | undefined>);

  constructor(
    state: State,
    {
      getEthereumChainConfigs,
    }: {
      getEthereumChainConfigs?: NetworksStore['getEthereumChainConfigs'];
    } = {}
  ) {
    super(state);
    this.getEthereumChainConfigs = getEthereumChainConfigs ?? null;
  }

  private getKnownIdsSet() {
    return new Set([
      ...this.networkConfigs.map((config) => config.id),
      ...this.customNetworkConfigs.map((config) => config.id),
    ]);
  }

  private async updateNetworks() {
    const savedChainConfigs = await this.getEthereumChainConfigs?.();
    const networks = new Networks({
      networks: mergeNetworkConfigs(
        this.networkConfigs,
        this.customNetworkConfigs
      ),
      ethereumChainConfigs: savedChainConfigs || [],
    });
    this.setState({ networks });
    return networks;
  }

  private async fetchNetworks({
    chains,
    update,
  }: {
    chains?: string[];
    update?: boolean;
  }) {
    const existingIdsSet = this.getKnownIdsSet();
    const shouldUpdateNetworksInfo =
      update || chains?.some((id) => !existingIdsSet.has(id));
    const existingNetworks = this.getState().networks;
    if (!shouldUpdateNetworksInfo && existingNetworks) {
      return existingNetworks;
    }

    const savedChainConfigs = await this.getEthereumChainConfigs?.();
    const savedIds = savedChainConfigs?.map((config) => config.id);
    const chainsToFetch = Array.from(
      new Set([...(savedIds || []), ...(chains || [])])
    );

    const [extraNetworkConfigs, commonNetworkConfigs] =
      await Promise.allSettled([getNetworks(chainsToFetch), getNetworks()]);
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
        .map((config) => toNetworkConfig(config.value)) || [];

    return this.updateNetworks();
  }

  private async fetchNetworkById(chainId: ChainId) {
    const shouldUpdateNetworksInfo = [
      ...this.networkConfigs,
      ...this.customNetworkConfigs,
    ].every((network) => getChainId(network) !== chainId);
    const existingNetworks = this.getState().networks;
    if (!shouldUpdateNetworksInfo && existingNetworks) {
      return existingNetworks;
    }
    const network = await getNetworkByChainId(chainId);
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

  async load(chains?: string[]) {
    const key = JSON.stringify(chains || []);
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworks({ chains });
    }
    return this.loaderPromises[key].then((networks) => {
      delete this.loaderPromises[key];
      return networks;
    });
  }

  async update() {
    const key = 'update';
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworks({ update: true });
    }
    return this.loaderPromises[key].then((networks) => {
      delete this.loaderPromises[key];
      return networks;
    });
  }

  async loadNetworksWithChainId(chainId: ChainId) {
    const key = `chainId-${chainId}`;
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworkById(chainId);
    }
    return this.loaderPromises[key].then((networks) => {
      delete this.loaderPromises[key];
      return networks;
    });
  }
}
