import { normalizeAddress } from 'src/shared/normalizeAddress';
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
      normalizeAddress(tx.transaction.from) === normalizeAddress(address) &&
      normalizeChainId(tx.transaction.chainId) === chainId
  );
  const nonces = transactions.map((tx) => Number(tx.transaction.nonce));
  return Math.max(...nonces);
}
