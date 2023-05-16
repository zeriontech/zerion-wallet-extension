import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import type { CustomConfiguration } from './TransactionConfiguration';

export function applyConfiguration(
  transaction: IncomingTransaction,
  configuration: CustomConfiguration
) {
  const { nonce } = configuration;
  if (nonce != null) {
    return { ...transaction, nonce: parseInt(nonce) };
  } else {
    return transaction;
  }
}
