import type { AddressAction, Client } from 'defi-sdk';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export async function getLatestNonceKnownByBackend(params: {
  address: string;
  chain: string;
  /**
   * Passing {hash} is required because if we don't, backend will return any
   * supported transaction, and it could be of type "receive". "Receive" transactions
   * do not indicate latest nonce for our address.
   * Excluding "receive" type in the request would be too fragile in case new types are introduced.
   * Therefore as a solution we pass {hash} of the transaction we locally know to be latest.
   * Querying by hash has downsides, too:
   *   Such request is too specific, while the info we need is much more generic. If the tx is not found by hash for
   *   any reason (time mismatch or maybe it's wrongly hidden by a filter), we won't be able to clear the whole
   *   queue of local transactions (if there are any with a lower nonce), even though backend is aware of them
   *   (that's because I don't plan to query each local transaction, only the latest one, because that should be
   *   technically be enough)
   *
   *   Another downside is that if user submits a tx with a nonce too high (which is possible as far as I know),
   *   we will keep querying backend for it and get nothing, and we will once again unnecessarily keep the
   *   transactions with lower nonces.
   * These downsides are edge-cases and should be eventually-resolvable when a newer transaction is submitted.
   */
  hash: string;
  /**
   * Format: "2024-06-20T16:56:56.345Z" ({Date.toISOString()})
   * Pass this to backend to optimize search. It will not look further than the provided date
   */
  actions_since?: string;
  client: Client;
}): Promise<number | null> {
  const { address, chain, hash, actions_since, client } = params;
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
