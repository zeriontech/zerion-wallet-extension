import { ethers } from 'ethers';
import { Store } from 'store-unit';
import { networksStore } from 'src/modules/networks/networks-store';
import { emitter } from '../events';
import { set, get } from 'src/background/webapis/storage';
import produce from 'immer';
import type {
  StoredTransactions,
  TransactionObject,
} from 'src/modules/ethereum/transactions/types';

function upsert<T, K extends keyof T>(array: T[], newItem: T, idKey: K) {
  const pos = array.findIndex((item) => item[idKey] === newItem[idKey]);
  if (pos !== -1) {
    array.splice(pos, 1, newItem);
  } else {
    array.push(newItem);
  }
}

class TransactionsStore extends Store<StoredTransactions> {
  constructor(args: StoredTransactions) {
    super(args);
    this.on('change', (state) => {
      set('transactions', state);
    });
  }
}

export class TransactionService {
  private transactionsStore: TransactionsStore;

  constructor() {
    this.transactionsStore = new TransactionsStore([]);
  }

  async initialize() {
    console.log('TransactionService initialize');
    const transactions: StoredTransactions = (await get('transactions')) ?? [];
    this.transactionsStore = new TransactionsStore(transactions);
    this.addListeners();
  }

  addListeners() {
    emitter.on('pendingTransactionCreated', (transaction) => {
      const newItem = {
        transaction,
        hash: transaction.hash,
        timestamp: Date.now(),
      };
      this.waitForTransaction(newItem);
      this.transactionsStore.setState((state) =>
        produce(state, (draft) => {
          draft.push(newItem);
        })
      );
    });
  }

  async waitForTransaction(transactionObject: TransactionObject) {
    const networks = await networksStore.load();
    const { hash, transaction } = transactionObject;
    const { chainId: chainIdAsNumber } = transaction;
    const chainId = ethers.utils.hexValue(chainIdAsNumber);
    const nodeUrl = networks.getRpcUrlInternal(networks.getChainById(chainId));
    const provider = new ethers.providers.JsonRpcProvider(nodeUrl);
    console.log('waiting for receipt');
    const txReceipt = await provider.waitForTransaction(hash);
    console.log('transactionMined', txReceipt);
    emitter.emit('transactionMined', txReceipt);
    this.upsertTransaction({ ...transactionObject, receipt: txReceipt });
  }

  private upsertTransaction(value: TransactionObject) {
    this.transactionsStore.setState((state) =>
      produce(state, (draft) => {
        upsert(draft, value, 'hash');
      })
    );
  }
}
