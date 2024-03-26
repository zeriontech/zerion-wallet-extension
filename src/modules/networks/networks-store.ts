import { getChainId } from 'src/modules/networks/helpers';
import { Store } from 'store-unit';
import { isTruthy } from 'is-truthy-ts';
import type { ChainConfig } from '../ethereum/chains/ChainConfigStore';
import { isCustomNetworkId } from '../ethereum/chains/helpers';
import type { AddEthereumChainParameter } from './../ethereum/types/AddEthereumChainParameter';
import { Networks } from './Networks';
import { getNetworkByChainId, getNetworks } from './networks-api';
import type { NetworkConfig } from './NetworkConfig';
import { toNetworkConfig } from './helpers';
import { createChain } from './Chain';

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
  return [
    ...nextConfigs,
    ...prevConfigs.filter((config) => !nextConfigMap[config.id]),
  ];
}

export class NetworksStore extends Store<State> {
  private networkConfigs: NetworkConfig[] = [];
  private customNetworkConfigs: NetworkConfig[] = [];
  private loaderPromises: Record<string, Promise<Networks>> = {};
  private getEthereumChainConfigs:
    | null
    | (() => Promise<ChainConfig | undefined>);

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
    this.customNetworkConfigs =
      savedChainConfigs?.ethereumChainConfigs
        ?.filter((config) => isCustomNetworkId(config.id))
        .map((config) =>
          toNetworkConfig(config.value, createChain(config.id))
        ) || [];

    const savedChainConfigById: Record<string, AddEthereumChainParameter> =
      Object.fromEntries(
        savedChainConfigs?.ethereumChainConfigs
          ?.map((config) =>
            isCustomNetworkId(config.id) ? null : [config.id, config.value]
          )
          .filter(isTruthy) || []
      );
    const chainsToFetch = Object.keys(savedChainConfigById).concat(
      ...(chains?.filter((id) => !savedChainConfigById[id]) || [])
    );

    const [extraNetworkConfigs, commonNetworkConfis] = await Promise.allSettled(
      [getNetworks(chainsToFetch), getNetworks()]
    );
    if (
      extraNetworkConfigs.status === 'fulfilled' &&
      commonNetworkConfis.status === 'fulfilled'
    ) {
      this.networkConfigs = mergeNetworkConfigs(
        this.networkConfigs,
        mergeNetworkConfigs(
          commonNetworkConfis.value,
          extraNetworkConfigs.value
        )
      );
    }

    const networks = new Networks({
      networks: mergeNetworkConfigs(
        this.networkConfigs,
        this.customNetworkConfigs
      ),
      ethereumChainConfigs: savedChainConfigs?.ethereumChainConfigs || [],
    });
    this.setState({ networks });
    return networks;
  }

  private async fetchNetworkById(chainId: number) {
    const hasInformationAboutChain = [
      ...this.networkConfigs,
      ...this.customNetworkConfigs,
    ].some((network) => getChainId(network) === chainId);
    const existingNetworks = this.getState().networks;
    if (hasInformationAboutChain && existingNetworks) {
      return existingNetworks;
    }
    const savedChainConfigs = await this.getEthereumChainConfigs?.();
    const network = await getNetworkByChainId(chainId);
    if (network) {
      this.networkConfigs = mergeNetworkConfigs(this.networkConfigs, [network]);
    }
    const networks = new Networks({
      networks: mergeNetworkConfigs(
        this.networkConfigs,
        this.customNetworkConfigs
      ),
      ethereumChainConfigs: savedChainConfigs?.ethereumChainConfigs || [],
    });
    this.setState({ networks });
    return networks;
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

  async loadNetworksWithChainId(chainId: number) {
    const key = `chainId-${chainId}`;
    if (!this.loaderPromises[key]) {
      this.loaderPromises[key] = this.fetchNetworkById(chainId);
    }
    return this.loaderPromises[key].then((networks) => {
      delete this.loaderPromises[key];
      return networks;
    });
  }

  async push(...extraNetworkConfigs: NetworkConfig[]) {
    const savedChainConfigs = await this.getEthereumChainConfigs?.();
    this.networkConfigs = mergeNetworkConfigs(
      this.networkConfigs,
      extraNetworkConfigs
    );
    const networks = new Networks({
      networks: mergeNetworkConfigs(
        this.networkConfigs,
        this.customNetworkConfigs
      ),
      ethereumChainConfigs: savedChainConfigs?.ethereumChainConfigs || [],
    });
    this.setState({ networks });
    return networks;
  }
}
