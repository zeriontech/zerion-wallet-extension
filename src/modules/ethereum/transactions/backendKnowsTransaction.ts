import type { NetworksSource } from 'src/modules/zerion-api/shared';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

/**
 * Answers "has the backend seen transaction {hash} yet?".
 *
 * This used to be `getLatestNonceKnownByBackend`, which read
 * `actions[0].transaction.nonce` off the same request. ZPI's `ActionTransaction`
 * carries no nonce — but the caller never needed the round trip: it searches by
 * the hash of a transaction it stored itself, so the nonce coming back was
 * always the nonce it already had locally. The existence of the action is the
 * only new information, so that is all this returns.
 */
export async function backendKnowsTransaction(params: {
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
  source: NetworksSource;
}): Promise<boolean> {
  const { address, chain, hash, source } = params;
  // The socket request also carried {actions_since} to narrow the server-side
  // search. ZPI has no equivalent; it was an optimisation, not a correctness
  // bound, and this runs on a daily background alarm, so it is simply dropped.
  const payload = {
    currency: 'usd',
    addresses: [address],
    chain,
    searchQuery: hash,
    limit: 1,
  };
  const response = await Promise.race([
    ZerionAPI.walletGetActions(payload, { source }),
    rejectAfterDelay(
      10000,
      `backendKnowsTransaction(${JSON.stringify(payload)})`
    ),
  ]);
  return response.data.length > 0;
}
