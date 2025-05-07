import type { SignatureLike } from 'ethers';
import { valueToHex } from 'src/shared/units/valueToHex';
import type {
  IncomingTransaction,
  IncomingTransactionAA,
  SerializableTransactionRequest,
} from '../types/IncomingTransaction';

const knownFields: Array<keyof IncomingTransaction> = [
  'from',
  'to',
  'nonce',
  'data',
  'value',
  'chainId',
  'type',
  'accessList',
  'gasLimit',
  'gasPrice',
  'maxPriorityFeePerGas',
  'maxFeePerGas',
  'customData',
  'maxFeePerBlobGas',
  'authorizationList',
];

/** Gets rid of BigInt values */
function toSerializableSignature(signature: SignatureLike): SignatureLike {
  if (typeof signature === 'string') {
    return signature;
  }
  if (typeof signature.v === 'bigint') {
    signature.v = valueToHex(signature.v);
  }
  return signature;
}

/** Gets rid of BigInt values */
function toSerializableAuthorizationList(
  list: NonNullable<IncomingTransaction['authorizationList']>
): NonNullable<IncomingTransaction['authorizationList']> {
  return list.map((item) => ({
    address: item.address,
    chainId: valueToHex(item.chainId),
    nonce: valueToHex(item.nonce),
    signature: toSerializableSignature(item.signature),
  }));
}

export function prepareTransaction(incomingTransaction: IncomingTransactionAA) {
  const transaction: SerializableTransactionRequest = {};
  for (const field of knownFields) {
    const knownField = field as keyof IncomingTransactionAA;
    if (incomingTransaction[knownField] !== undefined) {
      // @ts-ignore
      transaction[knownField] = incomingTransaction[knownField];
    }
  }
  if (incomingTransaction.gas) {
    transaction.gasLimit = valueToHex(incomingTransaction.gas);
  }
  if (incomingTransaction.value) {
    transaction.value = valueToHex(incomingTransaction.value);
  }
  if (
    incomingTransaction.chainId &&
    typeof incomingTransaction.chainId === 'string'
  ) {
    transaction.chainId = parseInt(incomingTransaction.chainId);
  }
  if (
    incomingTransaction.type != null &&
    typeof incomingTransaction.type === 'string'
  ) {
    transaction.type = parseInt(incomingTransaction.type);
  }
  if (
    incomingTransaction.authorizationList &&
    incomingTransaction.authorizationList.length
  ) {
    transaction.authorizationList = toSerializableAuthorizationList(
      incomingTransaction.authorizationList
    );
  }
  return transaction;
}
