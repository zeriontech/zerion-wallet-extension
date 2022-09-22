import type { IncomingTransaction } from '../types/IncomingTransaction';

export function getGas(transaction: Partial<IncomingTransaction>) {
  const { gas, gasLimit } = transaction;
  return gas ?? gasLimit;
}
