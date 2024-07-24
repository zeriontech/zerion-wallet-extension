import { client } from 'defi-sdk';
import type { WalletRecord } from 'src/shared/types/WalletRecord';
import { chainConfigStore } from '../ethereum/chains/ChainConfigStore';
import { configureBackgroundTestClient } from '../defi-sdk/background';
import type { ChainId } from '../ethereum/transactions/ChainId';
import { NetworksStore } from './networks-store';
import type { NetworkConfig } from './NetworkConfig';
import type { Chain } from './Chain';

export const mainNetworksStore = new NetworksStore(
  { networks: null },
  {
    getOtherNetworkData: async () => {
      await chainConfigStore.ready();
      const { ethereumChainConfigs, visitedChains = null } =
        chainConfigStore.getState();
      return { ethereumChainConfigs, visitedChains };
    },
    client,
    testnetMode: false,
  }
);

export const testenvNetworksStore = new NetworksStore(
  { networks: null },
  {
    getOtherNetworkData: async () => {
      await chainConfigStore.ready();
      const { ethereumChainConfigs, visitedChains = null } =
        chainConfigStore.getState();
      return { ethereumChainConfigs, visitedChains };
    },
    client: configureBackgroundTestClient(),
    testnetMode: true,
  }
);

export function getNetworksStore(
  preferences: Pick<WalletRecord['publicPreferences'], 'testnetMode'>
) {
  return preferences.testnetMode?.on ? testenvNetworksStore : mainNetworksStore;
}

interface FetchNetworkOptions {
  preferences: Pick<WalletRecord['publicPreferences'], 'testnetMode'>;
  /**
   * 'current' chooses networks store based on preferences.testnetMode value
   * 'mainnet' uses mainnet networks store
   * 'testnet-first' will try testnet networks store first IF {preferences.testnetMode.on}, if no network is found, it will try mainNetworksStore
   */
  apiEnv: 'mainnet' | 'testnet-first' | 'current';
}

export async function fetchNetworkById({
  networkId,
  preferences,
  apiEnv,
}: { networkId: Chain } & FetchNetworkOptions): Promise<NetworkConfig | null> {
  const id = networkId.toString();
  if (
    preferences.testnetMode?.on &&
    (apiEnv === 'current' || apiEnv === 'testnet-first')
  ) {
    const testNetworks = await testenvNetworksStore.load({ chains: [id] });
    const network = testNetworks.getNetworkByName(networkId);
    if (network) {
      return network;
    } else if (apiEnv === 'current') {
      return null;
    }
  }
  const networks = await mainNetworksStore.load({ chains: [id] });
  return networks.getNetworkByName(networkId) || null;
}

export async function fetchNetworkByChainId({
  chainId,
  preferences,
  apiEnv,
}: { chainId: ChainId } & FetchNetworkOptions): Promise<NetworkConfig | null> {
  if (
    preferences.testnetMode?.on &&
    (apiEnv === 'current' || apiEnv === 'testnet-first')
  ) {
    const testNetworks = await testenvNetworksStore.loadNetworksByChainId(
      chainId
    );
    try {
      return testNetworks.getNetworkById(chainId);
    } catch {
      if (apiEnv === 'current') {
        return null;
      } else {
        // Do nothing, continue to query mainnet networks store
      }
    }
  }
  const networks = await mainNetworksStore.loadNetworksByChainId(chainId);
  try {
    return networks.getNetworkById(chainId);
  } catch {
    return null;
  }
}

chainConfigStore.on('change', () => {
  mainNetworksStore.update();
  testenvNetworksStore.update();
});
