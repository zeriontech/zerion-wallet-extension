import { walletPort } from 'src/ui/shared/channels';
import { NetworksStore } from './networks-store';

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainConfigs: async () => {
      return walletPort.request('getEthereumChainSources');
    },
  }
);
