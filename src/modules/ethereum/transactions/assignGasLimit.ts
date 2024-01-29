import { ethers } from 'ethers';
import type { IncomingTransaction } from '../types/IncomingTransaction';

export function assignGasLimit<T extends Partial<IncomingTransaction>>(
  transaction: T,
  gasLimit: string
): T {
  return Object.assign(transaction, {
    gas: ethers.utils.hexValue(Number(gasLimit)),
  });
}
