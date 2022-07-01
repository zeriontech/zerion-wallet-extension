import type { UnsignedTransaction as UnsignedTransactionWithoutFrom } from 'ethers';

export interface UnsignedTransaction extends UnsignedTransactionWithoutFrom {
  from?: string;
}
