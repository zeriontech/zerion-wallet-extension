// import type { BigNumberish } from 'ethers';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import type { UnsignedTransaction } from './UnsignedTransaction';

export type IncomingTransaction = Omit<
  UnsignedTransaction,
  'chainId' | 'type'
> & {
  chainId?: number | string;
  gas?: string;
  type?: string | number | null;
};

export type IncomingTransactionWithChainId = PartiallyRequired<
  IncomingTransaction,
  'chainId'
>;
