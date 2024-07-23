import { client } from 'defi-sdk';
import { walletPort } from 'src/ui/shared/channels';
import { getPreferences } from 'src/ui/features/preferences/usePreferences';
import { configureUITestClient } from '../defi-sdk';
import { NetworksStore } from './networks-store';

export const mainNetworksStore = new NetworksStore(
  { networks: null },
  {
    getSavedNetworkData: async () => {
      return walletPort.request('getSavedNetworkData');
    },
    client,
    testnetMode: false,
  }
);

export const testenvNetworksStore = new NetworksStore(
  { networks: null },
  {
    getSavedNetworkData: async () => {
      return walletPort.request('getSavedNetworkData');
    },
    client: configureUITestClient(),
    testnetMode: true,
  }
);

export async function getNetworksStore() {
  const preferences = await getPreferences();
  return preferences.testnetMode?.on ? testenvNetworksStore : mainNetworksStore;
}
