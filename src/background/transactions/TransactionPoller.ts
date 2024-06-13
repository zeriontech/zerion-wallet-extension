import { ethers } from 'ethers';
import memoize from 'lodash/memoize';
import { createNanoEvents } from 'nanoevents';
import { RequestCache } from 'src/modules/request-cache/request-cache';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { createMockReceipt, DEBUGGING_TX_HASH } from './mocks';

class Interval {
  private cb: () => void;
  private intervalId: NodeJS.Timer | null = null;
  constructor(cb: () => void) {
    this.cb = cb;
    this.intervalId = null;
  }
  start(ms = 3000) {
    if (this.intervalId) {
      return;
    }
    this.intervalId = setInterval(this.cb, ms);
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
  private count = 0;

  async get(provider: ethers.providers.BaseProvider, hash: string) {
    if (hash === DEBUGGING_TX_HASH) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (this.count === 2) {
        this.count = 0;
        return createMockReceipt();
      } else {
        this.count++;
        return null;
      }
    } else {
      return provider.getTransactionReceipt(hash);
    }
  }
}

export interface PollingTx {
  hash: string;
  chainId: ChainId;
  from: string;
  nonce: number;
}

interface Options {
  getRpcUrlByChainId: (chainId: ChainId) => Promise<string | null>;
}

export class TransactionsPoller {
  private interval: Interval;
  private hashes: Map<string, PollingTx> = new Map();
  private requestInProgress = false;
  private receiptGetter = new ReceiptGetter();
  private requestCache = new RequestCache();
  private options: Options | null = null;

  emitter = createNanoEvents<{
    mined: (receipt: ethers.providers.TransactionReceipt) => void;
    dropped: (hash: string) => void;
  }>();

  constructor() {
    this.interval = new Interval(this.makeRequest.bind(this));
  }

  setOptions(options: Options) {
    this.options = options;
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
    if (!this.options) {
      // eslint-disable-next-line no-console
      console.warn('Options are not initialized. Cannot make request');
      return;
    }
    if (this.requestInProgress) {
      return;
    }
    this.requestInProgress = true;
    const { getRpcUrlByChainId } = this.options;

    const promises = Array.from(this.hashes.values()).map(async (value) => {
      const { chainId, hash } = value;
      const rpcUrl = await getRpcUrlByChainId(chainId);
      if (!rpcUrl) {
        return null;
      }
      return Promise.all([
        this.getTransactionCount(rpcUrl, value.from).then((count) =>
          this.handleTransactionCount(count, value)
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

  private handleTransactionCount(count: number, value: PollingTx) {
    const latestNonce = count - 1;
    for (const tx of this.hashes.values()) {
      if (
        tx.from === value.from &&
        tx.chainId === value.chainId &&
        tx.nonce < latestNonce // for equal nonces we don't know if this tx has been mined or dropped
      ) {
        this.emitter.emit('dropped', tx.hash);
        this.hashes.delete(tx.hash);
      }
    }
  }

  add(items: PollingTx[]) {
    for (const item of items) {
      this.hashes.set(item.hash, item);
    }
    if (this.hashes.size) {
      this.interval.start();
    }
  }
}
