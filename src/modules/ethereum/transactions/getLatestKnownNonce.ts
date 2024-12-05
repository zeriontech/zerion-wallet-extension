import { normalizeChainId } from 'src/shared/normalizeChainId';
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
      tx.transaction.from === address &&
      normalizeChainId(tx.transaction.chainId) === chainId
  );
  const nonces = transactions.map((tx) => Number(tx.transaction.nonce));
  return Math.max(...nonces);
}
