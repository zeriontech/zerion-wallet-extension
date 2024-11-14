import type { types as zkSyncTypes } from 'zksync-ethers';
import { EIP712Signer, utils as zkSyncUtils } from 'zksync-ethers';
import { invariant } from 'src/shared/invariant';
import { normalizeChainId } from 'src/shared/normalizeChainId';

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
    message: EIP712Signer.getSignInput(transaction),
  };
}

export function serializePaymasterTx({
  transaction,
  signature,
}: {
  transaction: zkSyncTypes.TransactionRequest;
  signature: string;
}) {
  invariant(
    transaction.customData,
    'This method is intended for "paymaster" transactions (customData is expected)'
  );
  const rawTransaction = zkSyncUtils.serialize({
    ...transaction,
    customData: { ...transaction.customData, customSignature: signature },
  });
  return rawTransaction;
}
