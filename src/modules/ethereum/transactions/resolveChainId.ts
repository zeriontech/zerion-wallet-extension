import { invariant } from 'src/shared/invariant';
import { valueToHex } from 'src/shared/units/valueToHex';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export function resolveChainId(transaction: IncomingTransaction) {
  const { chainId: incomingChainId } = transaction;
  invariant(incomingChainId, 'Transaction object must have a chainId property');
  return valueToHex(incomingChainId);
}
