import type { BigNumberish } from 'ethers';
import type { UnsignedTransaction } from './UnsignedTransaction';

export type IncomingTransaction = Omit<UnsignedTransaction, 'chainId'> & {
  chainId?: number | string;
  gas?: BigNumberish;
};
