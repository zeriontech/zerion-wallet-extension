import { produce } from 'immer';
import type { BigNumberish } from 'ethers';
import omit from 'lodash/omit';
import type {
  AnyAddressAction,
  LocalAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { isLocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { isEthersV5BigNumber, valueToHex } from 'src/shared/units/valueToHex';
import { normalizeAddress } from 'src/shared/normalizeAddress';

export function fromAddressActionTransaction(
  transaction: (TransactionObject['transaction'] | LocalAddressAction['rawTransaction']) & {
    gasLimit?: BigNumberish;
    gasPrice?: BigNumberish;
    maxFeePerGas?: BigNumberish;
    maxPriorityFeePerGas?: BigNumberish;
    value?: BigNumberish;
  },
) {
  const tx: Record<string, unknown> = omit(transaction, [
    'chain',
    'confirmations',
    'fee',
    'status',
    'r',
    's',
    'v',
    'hash',
    'blockNumber',
    'blockHash',
    'timestamp',
    'raw',
    'wait',
  ]);
  for (const key in tx) {
    const value = tx[key];
    if (isEthersV5BigNumber(value)) {
      tx[key] = value._hex;
    }
  }
  return tx as unknown as IncomingTransaction;
}

export function removeGasPrice(tx: IncomingTransaction) {
  return omit(tx, ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
}

function increase(value: number, multiplier: number) {
  return Math.round(value * multiplier);
}

export function increaseGasPrices(chainGasPrices: ChainGasPrice | null): ChainGasPrice | null {
  if (!chainGasPrices) {
    return null;
  }
  return produce(chainGasPrices, (draft) => {
    if (draft.fast.classic) {
      draft.fast.classic = increase(draft.fast.classic, 1.1);
    }
    if (draft.fast.eip1559) {
      const { maxFee, priorityFee } = draft.fast.eip1559;
      draft.fast.eip1559.maxFee = increase(maxFee, 1.1);
      draft.fast.eip1559.priorityFee = increase(priorityFee, 1.1);
    }
  });
}

export function createCancelTransaction({
  from,
  nonce,
  chainId,
}: {
  from: string;
  nonce: number;
  chainId: string;
}) {
  return { from, to: from, value: valueToHex(0), chainId, data: '0x', nonce };
}

function restoreValue(value: BigNumberish) {
  if (value === '0x') {
    return '0x0';
  }
  return valueToHex(value);
}

export function isCancelTx(addressAction: AnyAddressAction) {
  if (isLocalAddressAction(addressAction)) {
    const { address } = addressAction;
    const { value, data, from } = addressAction.rawTransaction || {};
    if (!from || normalizeAddress(from) !== normalizeAddress(address)) {
      return false;
    }
    if (!value && !data) {
      return true;
    }
    if (value && data) {
      // TODO:
      // This logic falsely counts mint transaction on https://docs.zero.network/build-on-zero/claim-docs
      // as "cancel". This isn't critical currently as it only affects some UI labels, and doesn't affect functionality
      return Number(restoreValue(value)) === 0 && Number(restoreValue(data)) === 0;
    }
  }
  return false;
}
