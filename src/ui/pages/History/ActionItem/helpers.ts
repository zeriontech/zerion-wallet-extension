import { ethers } from 'ethers';
import omit from 'lodash/omit';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { getGas } from 'src/modules/ethereum/transactions/getGas';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { DNA_MINT_CONTRACT_ADDRESS } from 'src/ui/components/DnaClaim/dnaAddress';

export function isDnaMintAction(action: AnyAddressAction) {
  return (
    normalizeAddress(action.label?.value || '') === DNA_MINT_CONTRACT_ADDRESS
  );
}

function getHexString(value?: ethers.BigNumberish | null) {
  return value ? ethers.BigNumber.from(value).toHexString() : undefined;
}

export function transactionObjectToInterpretPayload(
  transaction: TransactionObject
) {
  return {
    ...transaction,
    transaction: {
      ...omit(transaction.transaction, [
        'gasLimit',
        'maxFeePerGas',
        'maxPriorityFeePerGas',
        'accessList',
        'confirmations',
        'hash',
        'nonce',
        'type',
      ]),
      to: transaction.transaction.to?.toLowerCase(),
      from: transaction.transaction.from?.toLowerCase(),
      chainId: ethers.utils.hexValue(transaction.transaction.chainId || ''),
      gasPrice: getHexString(transaction.transaction.gasPrice),
      maxFee: getHexString(transaction.transaction.maxFeePerGas),
      maxPriorityFee: getHexString(
        transaction.transaction.maxPriorityFeePerGas
      ),
      gas: getHexString(getGas(transaction.transaction)),
      value: getHexString(transaction.transaction.value),
    },
  };
}
