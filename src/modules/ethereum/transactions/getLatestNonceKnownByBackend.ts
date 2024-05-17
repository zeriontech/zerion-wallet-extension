import { client } from 'defi-sdk';
import type { AddressAction } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export async function getLatestNonceKnownByBackend(params: {
  address: string;
  chain: string;
  hash: string;
  /**
   * Format: "2024-06-20T16:56:56.345Z" ({Date.toISOString()})
   * Pass this to backend to optimize search. It will not look further than the provided date
   */
  actions_since?: string;
}): Promise<number | null> {
  const { address, chain, hash, actions_since } = params;
  const payload: Record<string, unknown> = {
    address,
    currency: 'usd',
    actions_chains: [chain],
    actions_search_query: hash,
    actions_limit: 1,
  };
  if (actions_since) {
    payload.actions_since = actions_since;
  }
  return Promise.race([
    new Promise<AddressAction[]>((resolve) => {
      const { unsubscribe } = client.cachedSubscribe<
        AddressAction[],
        'address',
        'actions'
      >({
        method: 'get',
        namespace: 'address',
        body: { scope: ['actions'], payload },
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
