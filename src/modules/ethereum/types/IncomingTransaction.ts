import type { BytesLike, TransactionRequest } from 'ethers';
import type { types } from 'zksync-ethers';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';

type AddressStr = string;

/**
 * Represents a tx object that can be received from
 * a dapp, an API response or created manually
 */
export type IncomingTransaction = TransactionRequest & {
  type?: null | string | number;
  to?: null | AddressStr;
  from?: null | AddressStr;
  gasLimit?: null | number | string;
  gas?: null | number | string;
  gasPrice?: null | number | string;
  maxPriorityFeePerGas?: null | number | string;
  maxFeePerGas?: null | number | string;
  value?: null | number | string;
  maxFeePerBlobGas?: null | number | string;
  chainId?: null | number | string;
};

type Eip712Meta = {
  gasPerPubdata?: string | number;
  factoryDeps?: BytesLike[];
  customSignature?: BytesLike;
  paymasterParams?: types.PaymasterParams;
};

export type IncomingTransactionAA = IncomingTransaction & {
  /** The custom data for EIP712 transaction metadata. */
  customData?: null | (Eip712Meta & { gasPerPubdataByte?: string | number });
};

/**
 * Represents a tx object that is compatible with the ethers library
 */
export type SerializableTransactionRequest = Omit<
  IncomingTransactionAA,
  'gas'
> & {
  type?: null | number;
  value?: null | string;
  chainId?: null | number;
  gasLimit?: null | string;
};

export type IncomingTransactionWithChainId = PartiallyRequired<
  IncomingTransaction,
  'chainId'
>;

export type IncomingTransactionWithFrom = PartiallyRequired<
  IncomingTransaction,
  'from'
>;
