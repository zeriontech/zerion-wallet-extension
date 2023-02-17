import { networksStore } from 'src/modules/networks/networks-store';
import type { AddressAction, ActionType } from 'defi-sdk';
import { ethers } from 'ethers';
import { capitalize } from 'capitalize-ts';
import sortBy from 'lodash/sortBy';
import {
  describeTransaction,
  TransactionAction,
  TransactionDescription,
} from './describeTransaction';
import type { StoredTransactions, TransactionObject } from './types';

export function dataToModel(transactions: StoredTransactions) {
  return sortBy(transactions, (item) => item.timestamp ?? Infinity).reverse();
}

export type PendingAddressAction = Omit<AddressAction, 'content'> & {
  asset_code?: string;
  address: string;
};

function decsriptionToType(description: TransactionDescription): ActionType {
  const types: Record<TransactionAction, ActionType> = {
    [TransactionAction.multicall]: 'execute',
    [TransactionAction.approve]: 'approve',
    [TransactionAction.swap]: 'trade',
    [TransactionAction.transfer]: 'send',
    [TransactionAction.supply]: 'deposit',
    [TransactionAction.deposit]: 'deposit',
    [TransactionAction.stake]: 'stake',
    [TransactionAction.unstake]: 'unstake',
    [TransactionAction.claim]: 'claim',
    [TransactionAction.mint]: 'mint',
    [TransactionAction.withdraw]: 'withdraw',
    [TransactionAction.setApprovalForAll]: 'approve',
    [TransactionAction.send]: 'send',
    [TransactionAction.contractInteraction]: 'execute',
  };
  return types[description.action] || 'execute';
}

export async function toAddressTransaction(
  transactionObject: TransactionObject
): Promise<PendingAddressAction> {
  const description = await describeTransaction(transactionObject.transaction);
  const networks = await networksStore.load();
  const { transaction, hash, receipt, timestamp } = transactionObject;
  return {
    id: hash,
    transaction: {
      hash,
      chain: transaction.chainId
        ? networks
            .getChainById(ethers.utils.hexValue(transaction.chainId))
            ?.toString()
        : '',
      status: receipt ? 'confirmed' : 'pending',
      fee: null,
      nonce: transaction.nonce,
    },
    datetime: new Date(timestamp ?? Date.now()).toISOString(),
    label: {
      type: 'to',
      display_value: {
        text: '',
      },
      value: '',
    },
    type: {
      display_value: capitalize(decsriptionToType(description)),
      value: decsriptionToType(description),
    },
    address: transaction.from,
    asset_code: description.approveAssetCode || description.sendAssetCode,
  };
}
