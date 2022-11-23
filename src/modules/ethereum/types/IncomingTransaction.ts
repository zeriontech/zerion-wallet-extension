import type { BigNumberish } from 'ethers';
import type { UnsignedTransaction } from './UnsignedTransaction';

export type IncomingTransaction = Omit<
  UnsignedTransaction,
  'chainId' | 'type'
> & {
  chainId?: number | string;
  gas?: BigNumberish;
  type?: string | number | null;
};
