import { ethers } from 'ethers';
import { PersistentStore } from 'src/modules/persistent-store';
import { produce } from 'immer';
import type {
  StoredTransactions,
  TransactionObject,
} from 'src/modules/ethereum/transactions/types';
import { upsert } from 'src/shared/upsert';
import { getPendingTransactions } from 'src/modules/ethereum/transactions/model';
import { registerTransaction } from 'src/modules/defi-sdk/registerTransaction';
import { isLocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { emitter } from '../events';
import { createMockTxResponse } from './mocks';
import type { PollingTx } from './TransactionPoller';
import { TransactionsPoller } from './TransactionPoller';

class TransactionsStore extends PersistentStore<StoredTransactions> {
  upsertTransaction(value: TransactionObject) {
    this.setState((state) =>
      produce(state, (draft) => {
        upsert(draft, value, (x) => x.hash);
      })
    );
  }

  getByHash(hash: string) {
    return this.getState().find((item) => item.hash === hash);
  }
}

function toPollingObj(value: TransactionObject): PollingTx {
  return {
    hash: value.hash,
    chainId: ethers.utils.hexValue(value.transaction.chainId),
    nonce: value.transaction.nonce,
    from: value.transaction.from,
  };
}

export class TransactionService {
  private transactionsStore: TransactionsStore;
  private transactionsPoller: TransactionsPoller;

  constructor() {
    this.transactionsStore = new TransactionsStore([], 'transactions');
    this.transactionsPoller = new TransactionsPoller();
  }

  async initialize() {
    await this.transactionsStore.ready();
    const pending = getPendingTransactions(this.transactionsStore.getState());
    this.transactionsPoller.add(pending.map(toPollingObj));
    this.addListeners();
  }

  private markAsDropped(item: TransactionObject | undefined) {
    if (item) {
      this.transactionsStore.upsertTransaction({ ...item, dropped: true });
    }
  }

  addListeners() {
    emitter.on(
      'transactionSent',
      ({ transaction, initiator, addressAction }) => {
        const newItem: TransactionObject = {
          transaction,
          hash: transaction.hash,
          initiator,
          timestamp: Date.now(),
        };
        if (
          addressAction &&
          isLocalAddressAction(addressAction) &&
          addressAction.relatedTransaction
        ) {
          newItem.relatedTransactionHash = addressAction.relatedTransaction;
        }
        this.transactionsPoller.add([toPollingObj(newItem)]);

        this.transactionsStore.setState((state) =>
          produce(state, (draft) => {
            draft.push(newItem);
          })
        );
      }
    );

    emitter.on('transactionSent', ({ transaction }) => {
      registerTransaction(transaction);
    });

    this.transactionsPoller.emitter.on('mined', (receipt) => {
      const item = this.transactionsStore.getByHash(receipt.transactionHash);
      if (item) {
        this.transactionsStore.upsertTransaction({ ...item, receipt });
        if (item.relatedTransactionHash) {
          const relatedItem = this.transactionsStore.getByHash(
            item.relatedTransactionHash
          );
          // NOTE: there still a possible opposite case:
          // There can be a transaction with "ratedTransactionHash" equal to currently mined one,
          // but this might be resolved by transactionsPoller
          this.markAsDropped(relatedItem);
        }
      }
    });
    this.transactionsPoller.emitter.on('dropped', (hash) => {
      const item = this.transactionsStore.getByHash(hash);
      this.markAsDropped(item);
    });
  }
}

function testAddTransaction() {
  emitter.emit('transactionSent', {
    transaction: createMockTxResponse(),
    initiator: 'https://app.zerion.io',
    feeValueCommon: '0.123',
    addressAction: null,
  });
}

Object.assign(globalThis, { testAddTransaction });
