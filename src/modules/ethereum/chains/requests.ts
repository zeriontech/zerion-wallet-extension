import { client } from 'defi-sdk';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export function fetchChains(
  payload: {
    supported_only?: boolean;
    include_testnets?: boolean;
    group?: 'testnets';
    search_query?: string;
    ids?: string[];
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
      onData: ({ value, isStale }) => {
        if (value) {
          resolve(value);
          if (!isStale) {
            unsubscribe();
          }
        }
      },
    });
  });
}

export async function getNetworksBySearch({ query }: { query: string }) {
  return Promise.race([
    fetchChains({
      include_testnets: true,
      supported_only: false,
      search_query: query.trim().toLowerCase(),
    }),
    rejectAfterDelay(12000, `getNetworksBySearch(${query})`),
  ]);
}
