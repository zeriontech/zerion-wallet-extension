import { normalizeAddress } from 'src/shared/normalizeAddress';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { invariant } from 'src/shared/invariant';
import type { ChainId } from './ChainId';
import type { StoredTransactions } from './types';

export function getLatestLocallyKnownNonce({
  state,
  address,
  chainId,
}: {
  state: StoredTransactions;
  address: string;
  chainId: ChainId;
}): number {
  const transactions = state.filter(
    (tx) =>
      tx.hash &&
      normalizeAddress(tx.transaction.from) === normalizeAddress(address) &&
      normalizeChainId(tx.transaction.chainId) === chainId
  );
  const nonces = transactions.map((tx) => {
    invariant(tx.hash, 'Evm item is expected');
    return Number(tx.transaction.nonce);
  });
  return Math.max(...nonces);
}
