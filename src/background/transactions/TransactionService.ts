import { ethers } from 'ethers';
import { Store } from 'store-unit';
import { networksStore } from 'src/modules/networks/networks-store.background';
import * as browserStorage from 'src/background/webapis/storage';
import produce from 'immer';
import type {
  StoredTransactions,
  TransactionObject,
} from 'src/modules/ethereum/transactions/types';
import { upsert } from 'src/shared/upsert';
import { emitter } from '../events';

class TransactionsStore extends Store<StoredTransactions> {
  constructor(args: StoredTransactions) {
    super(args);
    this.on('change', (state) => {
      browserStorage.set('transactions', state);
    });
  }

  getPending() {
    return this.state.filter((t) => !t.receipt);
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
    const transactions: StoredTransactions =
      (await browserStorage.get('transactions')) ?? [];
    this.transactionsStore = new TransactionsStore(transactions);
    this.addListeners();
    this.waitForPendingTransactions();
  }

  waitForPendingTransactions() {
    this.transactionsStore.getPending().map((t) => this.waitForTransaction(t));
  }

  addListeners() {
    emitter.on('transactionSent', ({ transaction, initiator }) => {
      const newItem = {
        transaction,
        hash: transaction.hash,
        initiator,
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
  emitter.emit('transactionSent', {
    transaction: {
      accessList: [],
      chainId: 137,
      confirmations: 0,
      data: '0x095ea7b3000000000000000000000000d7f1dd5d49206349cae8b585fcb0ce3d96f1696fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      from: '0x42b9dF65B219B3dD36FF330A4dD8f327A6Ada990',
      gasLimit: ethers.BigNumber.from(1337),
      gasPrice: null,
      hash: DEBUGGING_TX_HASH,
      maxFeePerGas: {},
      maxPriorityFeePerGas: {},
      nonce: 239,
      to: '0xd7F1Dd5D49206349CaE8b585fcB0Ce3D96f1696F',
      type: 2,
      value: {},
    } as unknown as ethers.providers.TransactionResponse,
    initiator: 'https://app.zerion.io',
    feeValueCommon: '0.123',
  });
}

Object.assign(globalThis, { testAddTransaction });
