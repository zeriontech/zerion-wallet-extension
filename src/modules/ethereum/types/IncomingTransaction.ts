import type { BigNumberish } from 'ethers';
import type { UnsignedTransaction } from './UnsignedTransaction';

export type IncomingTransaction = UnsignedTransaction & {
  chainId?: number | string;
  gas?: BigNumberish;
};
