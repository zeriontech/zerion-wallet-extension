import { Store } from 'store-unit';
import throttle from 'lodash/throttle';
import { produce } from 'immer';
import type { EthereumChainSources } from './Networks';
import { Networks } from './Networks';
import { get as getNetworks } from './networks-api';
import { chainsInfo } from './networks-fallback';

interface State {
  networks: Networks | null;
}

export class NetworksStore extends Store<State> {
  private loaderPromise: Promise<Networks> | null = null;
  private getEthereumChainSources:
    | null
    | (() => Promise<EthereumChainSources | undefined>);

  private needsRetry = true;

  constructor(
    state: State,
    {
      getEthereumChainSources,
    }: {
      getEthereumChainSources?: NetworksStore['getEthereumChainSources'];
    } = {}
  ) {
    super(state);
    this.getEthereumChainSources = getEthereumChainSources ?? null;
  }

  private ensureNetworkConfigTypes(
    ethereumChainSources?: EthereumChainSources
  ): EthereumChainSources | undefined {
    if (!ethereumChainSources) {
      return undefined;
    }
    return produce(ethereumChainSources, (draft) => {
      draft.custom?.ethereumChains?.forEach((chainConfig) => {
        if (chainConfig.value.native_asset?.decimals) {
          // there was a problem where some native_token decimals were saved as string
          chainConfig.value.native_asset.decimals = Number(
            chainConfig.value.native_asset.decimals
          );
        }
      });
    });
  }

  private async fetchAndUpdate() {
    return Promise.allSettled([
      getNetworks(),
      this.getEthereumChainSources?.(),
    ]).then(([networksValue, ethereumChainSources]) => {
      const networks = new Networks({
        networks:
          networksValue.status === 'fulfilled'
            ? networksValue.value
            : chainsInfo,
        ethereumChainSources:
          ethereumChainSources.status === 'fulfilled'
            ? this.ensureNetworkConfigTypes(ethereumChainSources.value)
            : undefined,
      });
      this.setState({ networks });
      this.needsRetry = networksValue.status === 'rejected';
      return networks;
    });
  }

  async load(): Promise<Networks> {
    if (!this.loaderPromise) {
      this.loaderPromise = this.fetchAndUpdate();
    }
    return this.loaderPromise
      .then(() => {
        const { networks } = this.getState();
        if (!networks) {
          throw new Error('networks are expected to be not null after load()');
        }
        if (this.needsRetry) {
          this.retry();
        }
        return networks;
      })
      .catch((error) => {
        this.loaderPromise = null;
        throw error;
      });
  }

  async update() {
    this.loaderPromise = null;
    return this.fetchAndUpdate();
  }

  retry = throttle(() => {
    this.fetchAndUpdate();
  }, 15000);
}
