import { ethers } from 'ethers';
import memoize from 'lodash/memoize';
import { createNanoEvents } from 'nanoevents';
import { networksStore } from 'src/modules/networks/networks-store.background';
import { RequestCache } from 'src/modules/request-cache/request-cache';
import { createMockReceipt, DEBUGGING_TX_HASH } from './mocks';

class Interval {
  private cb: () => void;
  private intervalId: NodeJS.Timer | null = null;
  constructor(cb: () => void) {
    this.cb = cb;
    this.intervalId = null;
  }
  start() {
    if (this.intervalId) {
      return;
    }
    this.intervalId = setInterval(this.cb, 3000);
  }
  stop() {
    if (!this.intervalId) {
      return;
    }
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

const getProviderMemoized = memoize(
  (url: string) => new ethers.providers.JsonRpcProvider(url)
);

class ReceiptGetter {
  private i = 0;

  async get(provider: ethers.providers.BaseProvider, hash: string) {
    if (hash === DEBUGGING_TX_HASH) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (this.i === 2) {
        this.i = 0;
        return createMockReceipt();
      } else {
        this.i++;
        return null;
      }
    } else {
      return provider.getTransactionReceipt(hash);
    }
  }
}

export interface PollingTx {
  hash: string;
  chainId: string;
  from: string;
  nonce: number;
}

export class TransactionsPoller {
  private interval: Interval;
  private hashes: Map<string, PollingTx> = new Map();
  private requestInProgress = false;
  private receiptGetter = new ReceiptGetter();
  private requestCache = new RequestCache();

  emitter = createNanoEvents<{
    mined: (receipt: ethers.providers.TransactionReceipt) => void;
    dropped: (hash: string) => void;
  }>();

  constructor() {
    this.interval = new Interval(this.makeRequest.bind(this));
  }

  add(items: PollingTx[]) {
    for (const item of items) {
      this.hashes.set(item.hash, item);
    }
    if (this.hashes.size) {
      this.interval.start();
    }
  }

  private async getTransactionCount(url: string, from: string) {
    const key = `${from}:${url}`;
    const provider = getProviderMemoized(url);
    return this.requestCache.get(
      key,
      () => provider.getTransactionCount(from),
      {
        staleTime: (fulfilledCount) => (fulfilledCount < 3 ? 30000 : 180000),
        retryTime: (rejectedCount) => (rejectedCount < 10 ? 1000 : Infinity),
      }
    );
  }

  private static receiptStaleTimeFuntion(fulfilledCount: number) {
    return fulfilledCount < 3
      ? 3000
      : fulfilledCount < 5
      ? 8000
      : fulfilledCount < 10
      ? 20000
      : 120000;
  }

  private async getTransactionReceipt(url: string, hash: string) {
    const key = `${hash}:${url}`;
    const provider = getProviderMemoized(url);
    return this.requestCache.get(
      key,
      () => this.receiptGetter.get(provider, hash),
      {
        staleTime: TransactionsPoller.receiptStaleTimeFuntion,
        retryTime: (rejectedCount) => (rejectedCount < 10 ? 1000 : Infinity),
      }
    );
  }

  private async makeRequest() {
    if (this.requestInProgress) {
      return;
    }
    this.requestInProgress = true;
    const networks = await networksStore.load();

    const promises = Array.from(this.hashes.values()).map(async (value) => {
      const { chainId, hash } = value;
      const rpcUrl = networks.getRpcUrlInternal(networks.getChainById(chainId));
      return Promise.all([
        this.getTransactionCount(rpcUrl, value.from).then((nonce) =>
          this.handleNonce(nonce, value)
        ),
        this.getTransactionReceipt(rpcUrl, hash).then((receipt) =>
          this.handleReceipt(receipt)
        ),
      ]);
    });
    await Promise.allSettled(promises);
    this.requestInProgress = false;

    if (this.hashes.size === 0) {
      this.interval.stop();
    }
  }

  private handleReceipt(receipt: null | ethers.providers.TransactionReceipt) {
    if (!receipt) {
      return;
    }
    const { transactionHash: hash } = receipt;
    const item = this.hashes.get(hash);
    if (!item) {
      return;
    }

    this.hashes.delete(hash); // remove this item because it's mined
    const { chainId, nonce, from } = item;
    // Any txs with same "chainId" and "from" and <= "nonce" are considered DROPPED
    for (const tx of this.hashes.values()) {
      if (tx.from === from && tx.chainId === chainId && tx.nonce <= nonce) {
        this.emitter.emit('dropped', tx.hash);
        this.hashes.delete(tx.hash);
      }
    }

    this.emitter.emit('mined', receipt);
  }

  private handleNonce(nonce: number, value: PollingTx) {
    for (const tx of this.hashes.values()) {
      if (
        tx.from === value.from &&
        tx.chainId === value.chainId &&
        tx.nonce < nonce
      ) {
        this.emitter.emit('dropped', tx.hash);
        this.hashes.delete(tx.hash);
      }
    }
  }
}
