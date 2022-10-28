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
import { upsert } from 'src/shared/upsert';

class TransactionsStore extends Store<StoredTransactions> {
  constructor(args: StoredTransactions) {
    super(args);
    this.on('change', (state) => {
      set('transactions', state);
    });
  }
}

const DEBUGGING_TX_HASH = '0x123123';

async function waitForTransaction(
  hash: string,
  provider: ethers.providers.Provider
): Promise<ethers.providers.TransactionReceipt> {
  if (hash === DEBUGGING_TX_HASH) {
    const receipt = {
      blockHash:
        '0xe485aa7e58d3338909fdc77fc7445da5f552e260dc23bdfe285a2adbe54b4f64',
      blockNumber: 31658369,
      byzantium: true,
      confirmations: 1,
      contractAddress: '',
      cumulativeGasUsed: {},
      effectiveGasPrice: {},
      from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
      gasUsed: {},
      logs: [],
      logsBloom: '0x002000...',
      status: 1,
      to: '0xd7F1Dd5D49206349CaE8b585fcB0Ce3D96f1696F',
      transactionHash: DEBUGGING_TX_HASH,
      transactionIndex: 6,
      type: 2,
    } as unknown as ethers.providers.TransactionReceipt;
    return new Promise((r) => setTimeout(() => r(receipt), 6000));
  } else {
    return provider.waitForTransaction(hash);
  }
}

export class TransactionService {
  private transactionsStore: TransactionsStore;

  constructor() {
    this.transactionsStore = new TransactionsStore([]);
  }

  async initialize() {
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

  private async waitForTransaction(transactionObject: TransactionObject) {
    const networks = await networksStore.load();
    const { hash, transaction } = transactionObject;
    const { chainId: chainIdAsNumber } = transaction;
    const chainId = ethers.utils.hexValue(chainIdAsNumber);
    const nodeUrl = networks.getRpcUrlInternal(networks.getChainById(chainId));
    const provider = new ethers.providers.JsonRpcProvider(nodeUrl);
    const txReceipt = await waitForTransaction(hash, provider);
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

function testAddTransaction() {
  emitter.emit('pendingTransactionCreated', {
    accessList: [],
    chainId: 137,
    confirmations: 0,
    data: '0x83d13e0100000000000...',
    from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
    gasLimit: {},
    gasPrice: null,
    hash: DEBUGGING_TX_HASH,
    maxFeePerGas: {},
    maxPriorityFeePerGas: {},
    nonce: 239,
    to: '0xd7F1Dd5D49206349CaE8b585fcB0Ce3D96f1696F',
    type: 2,
    value: {},
  } as unknown as ethers.providers.TransactionResponse);
}

Object.assign(window, { testAddTransaction });
