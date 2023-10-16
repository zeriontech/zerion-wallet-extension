import { ethers } from 'ethers';
import { PersistentStore } from 'src/modules/persistent-store';
import { produce } from 'immer';
import type {
  InterpretResponse,
  StoredTransactions,
  TransactionObject,
} from 'src/modules/ethereum/transactions/types';
import { upsert } from 'src/shared/upsert';
import { getPendingTransactions } from 'src/modules/ethereum/transactions/model';
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

  addListeners() {
    emitter.on('transactionSent', ({ transaction, initiator }) => {
      const newItem = {
        transaction,
        hash: transaction.hash,
        initiator,
        timestamp: Date.now(),
      };
      this.transactionsPoller.add([toPollingObj(newItem)]);

      this.transactionsStore.setState((state) =>
        produce(state, (draft) => {
          draft.push(newItem);
        })
      );
    });

    this.transactionsPoller.emitter.on('mined', (receipt) => {
      const item = this.transactionsStore.getByHash(receipt.transactionHash);
      if (item) {
        this.transactionsStore.upsertTransaction({ ...item, receipt });
      }
    });
    this.transactionsPoller.emitter.on('dropped', (hash) => {
      const item = this.transactionsStore.getByHash(hash);
      if (item) {
        this.transactionsStore.upsertTransaction({ ...item, dropped: true });
      }
    });
  }
}
// to be replaced with backend api for pending actions
class InterpretationStore {
  private interpretationStore: Record<string, InterpretResponse> = {};

  registerInterpretation(hash: string, interpretation: InterpretResponse) {
    this.interpretationStore[hash] = interpretation;
  }

  getInterpretationByHash(hash: string): InterpretResponse | undefined {
    return this.interpretationStore[hash];
  }
}

export const interpretationStore = new InterpretationStore();

function testAddTransaction() {
  emitter.emit('transactionSent', {
    transaction: createMockTxResponse(),
    initiator: 'https://app.zerion.io',
    feeValueCommon: '0.123',
  });
}

Object.assign(globalThis, { testAddTransaction });
