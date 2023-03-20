import { chainConfigStore } from '../ethereum/chains/ChainConfigStore';
import { getPredefinedChains } from '../ethereum/chains/getPredefinedChains';
import { Networks } from './Networks';
import { NetworksStore } from './networks-store';

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainSources: async () => {
      const predefined = await getPredefinedChains();
      await chainConfigStore.ready();
      return { predefined, custom: chainConfigStore.getState() };
    },
  }
);

chainConfigStore.on('change', () => {
  networksStore.setState((state) => {
    const { networks } = state;
    if (!networks) {
      return state;
    }

    return {
      networks: new Networks({
        networks: networks.getNetworks(),
        ethereumChainSources: {
          ...state.networks?.ethereumChainSources,
          custom: chainConfigStore.getState(),
        },
      }),
    };
  });
  // Should we call this?
  // networksStore.update();
});
