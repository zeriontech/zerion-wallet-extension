import { client } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';
import type { NetworkConfig } from './NetworkConfig';

function fetchNetworks(): Promise<NetworkConfig[]> {
  return new Promise((resolve) => {
    client.cachedSubscribe<NetworkConfig[], 'chains', 'info'>({
      namespace: 'chains',
      body: {
        scope: ['info'],
        payload: {},
      },
      onData: ({ value }) => {
        if (value) {
          resolve(value);
        }
      },
    });
  });
}

export function get(): Promise<NetworkConfig[]> {
  return Promise.race([
    fetchNetworks(),
    rejectAfterDelay(12000, 'fetchNetworks'),
  ]);
}
