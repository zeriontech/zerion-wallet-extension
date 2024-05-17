import { client } from 'defi-sdk';
import type { AddressAction } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export async function getLatestNonceKnownByBackend(payload: {
  address: string;
  chain: string;
  hash: string;
  /** Pass this to backend to optimize search. It will not look further than the provided date */
  since: number;
}): Promise<number | null> {
  const { address, chain, hash, since } = payload;
  return Promise.race([
    new Promise<AddressAction[]>((resolve) => {
      const { unsubscribe } = client.cachedSubscribe<
        AddressAction[],
        'address',
        'actions'
      >({
        method: 'get',
        namespace: 'address',
        body: {
          scope: ['actions'],
          payload: {
            address,
            currency: 'usd',
            actions_chains: [chain],
            actions_search_query: hash,
            actions_limit: 1,
            since,
          },
        },
        onData: ({ value }) => {
          if (value) {
            resolve(value);
            unsubscribe();
          }
        },
      });
    }),
    rejectAfterDelay(
      10000,
      `getLatestNonceKnownByBackend(${JSON.stringify(payload)})`
    ),
  ]).then((actions) => {
    if (actions.length) {
      return actions[0].transaction.nonce;
    } else {
      return null;
    }
  });
}
