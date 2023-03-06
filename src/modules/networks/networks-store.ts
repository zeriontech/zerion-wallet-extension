import { Store } from 'store-unit';
import { EthereumChainSources, Networks } from './Networks';
import { get as getNetworks } from './networks-api';

interface State {
  networks: Networks | null;
}

export class NetworksStore extends Store<State> {
  private loaderPromise: Promise<Networks> | null = null;
  private getEthereumChainSources:
    | null
    | (() => Promise<EthereumChainSources | undefined>);

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

  private async fetchAndUpdate() {
    return Promise.all([getNetworks(), this.getEthereumChainSources?.()]).then(
      ([networksValue, ethereumChainSources]) => {
        const networks = new Networks({
          networks: networksValue,
          ethereumChainSources,
        });
        this.setState({ networks });
        return networks;
      }
    );
  }

  async load(): Promise<Networks> {
    if (!this.loaderPromise) {
      this.loaderPromise = this.fetchAndUpdate();
    }
    return this.loaderPromise;
  }

  async update() {
    return this.fetchAndUpdate();
  }
}
