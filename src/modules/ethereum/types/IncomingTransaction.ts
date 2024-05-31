import type { BigNumberish } from 'ethers';
import type { TransactionRequest } from '@ethersproject/abstract-provider';
import type { types } from 'zksync-ethers';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';

export type IncomingTransaction = Omit<
  TransactionRequest,
  'chainId' | 'type'
> & {
  chainId?: number | string;
  gas?: string;
  type?: string | number | null;
};

export type IncomingTransactionAA = IncomingTransaction & {
  /** The custom data for EIP712 transaction metadata. */
  customData?: types.TransactionRequest['customData'] & {
    gasPerPubdataByte?: BigNumberish;
  };
};

export type IncomingTransactionWithChainId = PartiallyRequired<
  IncomingTransaction,
  'chainId'
>;

export type IncomingTransactionWithFrom = PartiallyRequired<
  IncomingTransaction,
  'from'
>;
