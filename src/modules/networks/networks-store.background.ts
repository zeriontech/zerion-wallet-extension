import { chainConfigStore } from '../ethereum/chains/ChainConfigStore';
import { NetworksStore } from './networks-store';

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainConfigs: async () => {
      await chainConfigStore.ready();
      return chainConfigStore.getState().ethereumChainConfigs;
    },
  }
);

chainConfigStore.on('change', () => {
  networksStore.update();
});
