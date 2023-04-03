import { client } from 'defi-sdk';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import type { ChainConfig } from './ChainConfigStore';

function fetchChains(
  payload: {
    supported_only?: boolean;
    include_testnets?: boolean;
    group?: 'testnets';
    search_query?: string;
  } = { supported_only: true }
): Promise<NetworkConfig[]> {
  return new Promise((resolve) => {
    const { unsubscribe } = client.cachedSubscribe<
      NetworkConfig[],
      'chains',
      'info'
    >({
      namespace: 'chains',
      body: {
        scope: ['info'],
        payload,
      },
      onData: ({ value }) => {
        if (value) {
          resolve(value);
          unsubscribe();
        }
      },
    });
  });
}

export async function getNetworksBySearch({ query }: { query: string }) {
  const networks = await fetchChains({
    include_testnets: true,
    supported_only: false,
    search_query: query,
  });
  return networks.slice(0, 20);
}

async function fetchTestnets() {
  const networks = await fetchChains({
    include_testnets: true,
    group: 'testnets',
    supported_only: false,
  });
  return {
    ethereumChains: networks.map((network) => ({
      created: 0,
      updated: 0,
      origin: 'predefined',
      value: network,
    })),
  };
}

const MAX_WAIT_TIME_MS = 30000;

export async function getPredefinedChains(): Promise<ChainConfig> {
  return Promise.race([fetchTestnets(), rejectAfterDelay(MAX_WAIT_TIME_MS)]);
}
