import type { BytesLike, ethers } from 'ethers';
import type { types as zkSyncTypes } from 'zksync-ethers';
import { EIP712Signer, utils as zkSyncUtils } from 'zksync-ethers';
import { invariant } from 'src/shared/invariant';
import { normalizeChainId } from 'src/shared/normalizeChainId';

type Eip712SignInput = ReturnType<(typeof EIP712Signer)['getSignInput']>;

/** Eip712SignInput without bigints..... */
interface SerializableEip712SignInput {
  txType: number;
  from: ethers.AddressLike | null | undefined;
  to: ethers.AddressLike | null | undefined;
  gasLimit: string | number;
  gasPerPubdataByteLimit: string | number;
  maxFeePerGas: string | number;
  maxPriorityFeePerGas: string | number;
  paymaster: string;
  nonce: number;
  value: string | number;
  data: string;
  factoryDeps: Uint8Array[];
  paymasterInput: BytesLike;
}

function fromBigInt(value: bigint | number | string) {
  return typeof value === 'bigint' ? String(value) : value;
}

function toSerializableMessage(
  message: Eip712SignInput
): SerializableEip712SignInput {
  return {
    ...message,
    gasLimit: fromBigInt(message.gasLimit),
    gasPerPubdataByteLimit: fromBigInt(message.gasPerPubdataByteLimit),
    maxFeePerGas: fromBigInt(message.maxFeePerGas),
    maxPriorityFeePerGas: fromBigInt(message.maxPriorityFeePerGas),
    value: fromBigInt(message.value),
  };
}

/**
 * Creates an "EIP-712 transaction": a TypedData object
 * that the user signs. The signature will be used when serializing the TransactionRequest
 */
export function createTypedData(transaction: zkSyncTypes.TransactionRequest) {
  invariant(
    Boolean(transaction.customData),
    'createTypedData expects a transaction with paymaster data'
  );
  const { chainId } = transaction;
  invariant(chainId, 'ChainId missing from TransactionRequest');
  const chainIdAsIntString = String(parseInt(normalizeChainId(chainId)));
  return {
    types: {
      Transaction: zkSyncUtils.EIP712_TYPES.Transaction,
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
    },
    domain: {
      name: 'zkSync',
      version: '2',
      chainId: chainIdAsIntString,
    },
    primaryType: 'Transaction',
    message: toSerializableMessage(EIP712Signer.getSignInput(transaction)),
  };
}

export function serializePaymasterTx({
  transaction,
  signature,
}: {
  transaction: zkSyncTypes.TransactionLike;
  signature: string;
}) {
  invariant(
    transaction.customData,
    'This method is intended for "paymaster" transactions (customData is expected)'
  );
  const rawTransaction = zkSyncUtils.serializeEip712({
    ...transaction,
    customData: { ...transaction.customData, customSignature: signature },
  });
  return rawTransaction;
}
