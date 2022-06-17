import { client } from 'defi-sdk';
import type { NetworkConfig } from './NetworkConfig';

export function get(): Promise<NetworkConfig[]> {
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
