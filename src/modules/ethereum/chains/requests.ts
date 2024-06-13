import { type Client } from 'defi-sdk';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export function fetchChains(
  payload: {
    supported_only?: boolean;
    include_testnets?: boolean;
    group?: 'testnets';
    search_query?: string;
    ids?: string[];
  },
  client: Client
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
            // TEMP: timeout fixes the "Cannot access 'unsubscribe' before initialization" error
            // This should be fixed in defi-sdk
            setTimeout(() => unsubscribe());
          }
        }
      },
    });
  });
}

export async function getNetworksBySearch({
  query,
  client,
}: {
  query: string;
  client: Client;
}) {
  return Promise.race([
    fetchChains(
      {
        include_testnets: true,
        supported_only: false,
        search_query: query.trim().toLowerCase(),
      },
      client
    ),
    rejectAfterDelay(12000, `getNetworksBySearch(${query})`),
  ]);
}
