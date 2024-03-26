import { invariant } from 'src/shared/invariant';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export function resolveChainId(transaction: IncomingTransaction) {
  const { chainId: incomingChainId } = transaction;
  invariant(incomingChainId, 'Transaction object must have a chainId property');
  return typeof incomingChainId === 'string'
    ? parseInt(incomingChainId)
    : incomingChainId;
}
