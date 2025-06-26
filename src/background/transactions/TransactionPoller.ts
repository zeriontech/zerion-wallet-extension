import { ethers } from 'ethers';
import memoize from 'lodash/memoize';
import { createNanoEvents } from 'nanoevents';
import { RequestCache } from 'src/modules/request-cache/request-cache';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { SignatureStatus } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import { invariant } from 'src/shared/invariant';

class Interval {
  private cb: () => void;
  private intervalId: NodeJS.Timeout | null = null;
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
  (url: string) => new ethers.JsonRpcProvider(url)
);

class ReceiptGetter {
  async get(provider: ethers.Provider, hash: string) {
    return provider.getTransactionReceipt(hash);
  }
}

export type PollingTx =
  | {
      standard: 'evm';
      hash: string;
      chainId: ChainId;
      from: string;
      nonce: number;
    }
  | {
      standard: 'solana';
      signature: string;
      from: string;
      timestamp: number;
    };

interface Options {
  getRpcUrlByChainId: (chainId: ChainId) => Promise<string | null>;
  getRpcUrlSolana: () => Promise<string | null>;
}

export class TransactionsPoller {
  private interval: Interval;
  private map: Map<string, PollingTx> = new Map();
  private requestInProgress = false;
  private receiptGetter = new ReceiptGetter();
  private requestCache = new RequestCache();
  private options: Options | null = null;

  emitter = createNanoEvents<{
    'evm:mined': (receipt: ethers.TransactionReceipt) => void;
    'solana:mined': (
      signature: string,
      signatureStatus: SignatureStatus
    ) => void;
    'evm:dropped': (hash: string) => void;
    'solana:dropped': (signature: string) => void;
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

  private async getSignatureStatus(url: string, signature: string) {
    const connection = new Connection(url);
    const key = `${signature}:${url}`;

    return this.requestCache.get(
      key,
      () =>
        connection.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        }),
      {
        staleTime: (fulfilledCount) => (fulfilledCount < 5 ? 2000 : 5000),
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
    const { getRpcUrlByChainId, getRpcUrlSolana } = this.options;

    const promises = Array.from(this.map.values()).map(async (value) => {
      if (value.standard === 'evm') {
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
      } else if (value.standard === 'solana') {
        const { signature } = value;
        const rpcUrl = await getRpcUrlSolana();
        if (!rpcUrl) {
          return null;
        }
        return Promise.all([
          this.checkForStaleness(signature),
          this.getSignatureStatus(rpcUrl, signature).then((response) => {
            this.handleSignature(response.value, signature);
          }),
        ]);
      }
    });
    await Promise.allSettled(promises);
    this.requestInProgress = false;

    if (this.map.size === 0) {
      this.interval.stop();
    }
  }

  private handleReceipt(receipt: null | ethers.TransactionReceipt) {
    if (!receipt) {
      return;
    }
    const { hash } = receipt;
    const item = this.map.get(hash);
    if (!item) {
      return;
    }
    invariant(item.standard === 'evm', 'Item must be evm');

    this.map.delete(hash); // remove this item because it's mined
    const { chainId, nonce, from } = item;
    // Any txs with same "chainId" and "from" and <= "nonce" are considered DROPPED
    for (const tx of this.map.values()) {
      if (
        tx.standard === 'evm' &&
        tx.from === from &&
        tx.chainId === chainId &&
        tx.nonce <= nonce
      ) {
        this.emitter.emit('evm:dropped', tx.hash);
        this.map.delete(tx.hash);
      }
    }

    this.emitter.emit('evm:mined', receipt);
  }

  private handleTransactionCount(count: number, value: PollingTx) {
    invariant(value.standard === 'evm');
    const latestNonce = count - 1;
    for (const tx of this.map.values()) {
      if (
        tx.standard === 'evm' &&
        tx.from === value.from &&
        tx.chainId === value.chainId &&
        tx.nonce < latestNonce // for equal nonces we don't know if this tx has been mined or dropped
      ) {
        this.emitter.emit('evm:dropped', tx.hash);
        this.map.delete(tx.hash);
      }
    }
  }

  /** Solana transactions older that several minutes are considered dropped */
  private checkForStaleness(signature: string) {
    const item = this.map.get(signature);
    if (item && item.standard === 'solana') {
      const FOUR_MINUTES = 1000 * 60 * 4;
      if (Date.now() - item.timestamp > FOUR_MINUTES) {
        this.map.delete(signature); // remove this item because it's mined
        this.emitter.emit('solana:dropped', signature);
      }
    }
  }

  private handleSignature(
    signatureStatus: SignatureStatus | null,
    signature: string
  ) {
    if (!signatureStatus) {
      this.checkForStaleness(signature);
      return;
    }
    if (signatureStatus.confirmationStatus === 'processed') {
      // wait for "confirmed" or "finalized"
      return;
    }
    const item = this.map.get(signature);
    if (!item) {
      return;
    }

    this.map.delete(signature); // remove this item because it's mined
    this.emitter.emit('solana:mined', signature, signatureStatus);
  }

  add(items: PollingTx[]) {
    for (const item of items) {
      if (item.standard === 'evm') {
        this.map.set(item.hash, item);
      } else if (item.standard === 'solana') {
        this.map.set(item.signature, item);
      }
    }
    if (this.map.size) {
      this.interval.start();
    }
  }
}
