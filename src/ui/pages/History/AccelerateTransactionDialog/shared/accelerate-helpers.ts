import { produce } from 'immer';
import type { BigNumberish, BytesLike } from 'ethers';
import { BigNumber } from 'ethers';
import omit from 'lodash/omit';
import {
  isLocalAddressAction,
  type AnyAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { TransactionObject } from 'src/modules/ethereum/transactions/types';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { valueToHex } from 'src/shared/units/valueToHex';
import { normalizeAddress } from 'src/shared/normalizeAddress';

export function fromAddressActionTransaction(
  transaction: (
    | TransactionObject['transaction']
    | AnyAddressAction['transaction']
  ) & {
    gasLimit?: BigNumber;
    gasPrice?: BigNumber;
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
    value?: BigNumberish;
  }
) {
  const tx = omit(transaction, [
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
  for (const untypedKey in tx) {
    const key = untypedKey as keyof typeof tx;
    const value = tx[key];
    if (BigNumber.isBigNumber(value)) {
      // @ts-ignore
      tx[key] = BigNumber.from(value).toHexString();
    }
  }
  return tx as IncomingTransaction;
}

export function removeGasPrice(tx: IncomingTransaction) {
  return omit(tx, ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
}

function increase(value: number, multiplier: number) {
  return Math.round(value * multiplier);
}

export function increaseGasPrices(
  chainGasPrices: ChainGasPrice | null
): ChainGasPrice | null {
  if (!chainGasPrices) {
    return null;
  }
  return produce(chainGasPrices, (draft) => {
    if (draft.info.classic) {
      const { fast } = draft.info.classic;
      draft.info.classic.fast = increase(fast, 1.1);
    }
    if (draft.info.eip1559?.fast) {
      const { max_fee, priority_fee } = draft.info.eip1559.fast;
      draft.info.eip1559.fast.max_fee = increase(max_fee, 1.1);
      draft.info.eip1559.fast.priority_fee = increase(priority_fee, 1.3);
    }
    if (draft.info.optimistic?.l2) {
      const { l2 } = draft.info.optimistic;
      draft.info.optimistic.l2 = increase(l2, 1.1);
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

function restoreValue(value: BigNumberish | BytesLike) {
  if (value === '0x') {
    return '0x0';
  }
  return BigNumber.isBigNumber(value)
    ? BigNumber.from(value).toHexString()
    : valueToHex(value);
}

export function isCancelTx(addressAction: AnyAddressAction) {
  if (isLocalAddressAction(addressAction)) {
    const { address } = addressAction;
    const { value, data, from } = addressAction.transaction;
    if (!from || normalizeAddress(from) !== normalizeAddress(address)) {
      return false;
    }
    if (!value && !data) {
      return true;
    }
    if (value && data) {
      return (
        Number(restoreValue(value)) === 0 && Number(restoreValue(data)) === 0
      );
    }
  }
  return false;
}
