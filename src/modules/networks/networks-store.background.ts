import type { ChainConfig } from '../ethereum/chains/ChainConfigStore';
import { chainConfigStore } from '../ethereum/chains/ChainConfigStore';
import { getPredefinedChains } from '../ethereum/chains/requests';
import { Networks } from './Networks';
import { NetworksStore } from './networks-store';

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainSources: async () => {
      await chainConfigStore.ready();
      const custom = chainConfigStore.getState();
      try {
        const predefined = await getPredefinedChains();
        return { predefined, custom };
      } catch (e) {
        return { custom } as { custom: ChainConfig };
      }
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
