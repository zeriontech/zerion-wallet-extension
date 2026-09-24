import { NetworkId } from 'src/modules/networks/NetworkId';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { StoredTransactions, TransactionObject } from './types';

/**
 * How long a local transaction outlives its submission on a network whose
 * history the backend indexes. By then the backend has the real action and
 * History dedupes the local copy by hash, so the local copy only costs storage.
 * Mirrors iOS, which deletes local pending actions older than 24h on launch.
 */
export const LOCAL_TRANSACTION_TTL_MS = 1000 * 60 * 60 * 24;

/** EIP-155 chain id for evm items, NetworkId.Solana for solana items */
export type TransactionNetworkKey = string;

export function getTransactionNetworkKey(
  item: TransactionObject
): TransactionNetworkKey {
  return item.hash
    ? normalizeChainId(item.transaction.chainId)
    : NetworkId.Solana;
}

export function isExpiredTransaction(item: TransactionObject, now: number) {
  return now - item.timestamp > LOCAL_TRANSACTION_TTL_MS;
}

/**
 * Local transactions that are safe to delete: older than the TTL *and* on a
 * network the backend keeps history for. Anything else (custom networks,
 * networks without actions support, networks we failed to resolve) is kept
 * indefinitely: the local copy is the only record the extension has of it.
 */
export function getExpiredTransactions(
  transactions: StoredTransactions,
  {
    now,
    networksWithHistory,
  }: { now: number; networksWithHistory: Set<TransactionNetworkKey> }
) {
  return transactions.filter(
    (item) =>
      isExpiredTransaction(item, now) &&
      networksWithHistory.has(getTransactionNetworkKey(item))
  );
}
