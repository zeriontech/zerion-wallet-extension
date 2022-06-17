import type { BigNumberish, UnsignedTransaction } from 'ethers';

export type IncomingTransaction = UnsignedTransaction & {
  chainId?: number | string;
  gas?: BigNumberish;
};
