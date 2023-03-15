import { chainConfigStore } from '../ethereum/chains/ChainConfigStore';
import { getPredefinedChains } from '../ethereum/chains/getPredefinedChains';
import { Networks } from './Networks';
import { NetworksStore } from './networks-store';

console.log('networksStore background');
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
});

// export class NetworksStoreWithCustomNetworks extends NetworksStore {
//   private readyPromise: Promise<void>;
//
//   constructor(
//     initialState: { networks: null },
//     chainConfigStore: ChainConfigStore
//   ) {
//     super(initialState, {
//       async getEthereumChainSources() {
//         const [predefined, custom] = await Promise.all([]);
//         await chainConfigStore.ready();
//
//         const custom = chainConfigStore.getState();
//         return { custom };
//       },
//     });
//
//     this.readyPromise = chainConfigStore.ready().then(() => {
//       chainConfigStore.on('change', async () => {
//         const { networks } = this.getState();
//         if (!networks) {
//           return;
//         }
//         const currentSources = networks.ethereumChainSources;
//         this.getState().networks?.updateEthereumChainSources({
//           ...currentSources,
//           custom: chainConfigStore.getState(),
//         });
//       });
//     });
//   }
//
//   async load() {
//     const value = await super.load();
//     await this.readyPromise;
//     return value;
//   }
// }
