import type { BigNumberish, TransactionRequest } from 'ethers';
import type { types } from 'zksync-ethers';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';

type AddressStr = string;
export type PlainAddressFields<T> = Omit<T, 'from' | 'to'> & {
  /** remove promise-like values from TransactionRequest */
  to?: null | AddressStr;
  /** remove promise-like values from TransactionRequest */
  from?: null | AddressStr;
};

export type IncomingTransaction = Omit<
  PlainAddressFields<TransactionRequest>,
  'type'
> & {
  // chainId?: number | string;
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
