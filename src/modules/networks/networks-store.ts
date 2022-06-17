import { Store } from 'store-unit';
import { Networks } from './Networks';
import { get as getNetworks } from './networks-api';

interface State {
  networks: Networks | null;
}

class NetworksStore extends Store<State> {
  private loaderPromise: Promise<Networks> | null = null;

  load() {
    if (this.loaderPromise) {
      return this.loaderPromise;
    }
    this.loaderPromise = getNetworks().then((value) => {
      const networks = new Networks({ networks: value });
      this.setState({ networks });
      return networks;
    });
    return this.loaderPromise;
  }
}

export const networksStore = new NetworksStore({ networks: null });
