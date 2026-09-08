import { walletPort } from 'src/ui/shared/channels';
import { getPreferences } from 'src/ui/features/preferences/usePreferences';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { NetworksStore } from './networks-store';

export const mainNetworksStore = new NetworksStore(
  { networks: null },
  {
    getOtherNetworkData: async () => {
      return walletPort.request('getOtherNetworkData');
    },
    getApiClient: () => ZerionAPI,
    source: 'mainnet',
  }
);

export const testenvNetworksStore = new NetworksStore(
  { networks: null },
  {
    getOtherNetworkData: async () => {
      return walletPort.request('getOtherNetworkData');
    },
    getApiClient: () => ZerionAPI,
    source: 'testnet',
  }
);

export async function getNetworksStore() {
  const preferences = await getPreferences();
  return preferences.testnetMode?.on ? testenvNetworksStore : mainNetworksStore;
}
