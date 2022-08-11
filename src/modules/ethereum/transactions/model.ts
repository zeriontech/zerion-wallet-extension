import type { AddressTransaction } from 'defi-sdk';
import { ethers } from 'ethers';
import sortBy from 'lodash/sortBy';
import { strings } from 'src/ui/transactions/strings';
import {
  describeTransaction,
  TransactionAction,
  TransactionDescription,
} from './describeTransaction';
import type { StoredTransactions, TransactionObject } from './types';

export function dataToModel(transactions: StoredTransactions) {
  return sortBy(transactions, (item) => item.timestamp ?? Infinity).reverse();
}

type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>;

export type PartialAddressTransaction = Optional<
  AddressTransaction,
  'block_number'
> & { chain_id?: string };

function decsriptionToType(
  description: TransactionDescription
): AddressTransaction['type'] {
  const types: { [key in TransactionAction]: AddressTransaction['type'] } = {
    [TransactionAction.approve]: 'authorize',
    [TransactionAction.contractInteraction]: 'execution',
    [TransactionAction.swap]: 'trade',
    [TransactionAction.transfer]: 'send',
  };
  return types[description.action] || 'execution';
}

export async function toAddressTransaction(
  transactionObject: TransactionObject
): Promise<PartialAddressTransaction> {
  const description = await describeTransaction(transactionObject.transaction);
  const { transaction, hash, receipt, timestamp } = transactionObject;
  return {
    id: hash,
    hash: hash,
    address_from: transaction.from,
    mined_at: (timestamp ?? Date.now()) / 1000,
    changes: [],
    address_to: description.assetReceiver || description.tokenSpender,
    block_number: transaction.blockNumber,
    type: decsriptionToType(description),
    contract: null,
    direction: 'out',
    fee: null,
    meta: {
      action: strings.actions[description.action],
    },
    nonce: transaction.nonce,
    protocol: null,
    status: receipt ? 'confirmed' : 'pending',
    chain_id: transaction.chainId
      ? ethers.utils.hexValue(transaction.chainId)
      : undefined,
  };
}
