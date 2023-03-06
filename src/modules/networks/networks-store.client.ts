import { walletPort } from 'src/ui/shared/channels';
import { NetworksStore } from './networks-store';

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainSources: async () => {
      const value = await walletPort.request('getCustomEthereumChains');
      return value;
    },
  }
);

Object.assign(window, { networksStore });
