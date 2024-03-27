import { ethers } from 'ethers';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export function getTransactionChainId(transaction: IncomingTransaction) {
  return transaction.chainId
    ? ethers.utils.hexValue(transaction.chainId)
    : null;
}
