import { chainConfigStore } from '../ethereum/chains/ChainConfigStore';
import { NetworksStore } from './networks-store';

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getChainSources: async () => {
      await chainConfigStore.ready();
      return chainConfigStore.getState();
    },
  }
);

chainConfigStore.on('change', () => {
  networksStore.update();
});
