import { walletPort } from 'src/ui/shared/channels';
import { getPreferences } from 'src/ui/features/preferences/usePreferences';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { NetworksStore } from './networks-store';

function getOtherNetworkData() {
  return walletPort.request('getOtherNetworkData');
}

export const mainNetworksStore = new NetworksStore(
  { networks: null },
  {
    getOtherNetworkData,
    getApiClient: () => ZerionAPI,
    source: 'mainnet',
  },
);

export const testenvNetworksStore = new NetworksStore(
  { networks: null },
  {
    getOtherNetworkData,
    getApiClient: () => ZerionAPI,
    source: 'testnet',
  },
);

export async function getNetworksStore() {
  const preferences = await getPreferences();
  return preferences.testnetMode?.on ? testenvNetworksStore : mainNetworksStore;
}

export async function updateNetworks() {
  if (mainNetworksStore.getState().networks || testenvNetworksStore.getState().networks) {
    const chainConfigs = await getOtherNetworkData();
    await Promise.all([
      mainNetworksStore.update(chainConfigs),
      testenvNetworksStore.update(chainConfigs),
    ]);
  }
}
