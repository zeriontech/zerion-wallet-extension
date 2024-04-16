import { invariant } from 'src/shared/invariant';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export function resolveChainId(transaction: IncomingTransaction) {
  const { chainId: incomingChainId } = transaction;
  invariant(incomingChainId, 'Transaction object must have a chainId property');
  return normalizeChainId(incomingChainId);
}
