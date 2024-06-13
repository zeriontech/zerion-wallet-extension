import browser from 'webextension-polyfill';
import { createNanoEvents } from 'nanoevents';
import { PersistentStore } from 'src/modules/persistent-store';
import { produce } from 'immer';
import throttle from 'lodash/throttle';
import type {
  StoredTransactions,
  TransactionObject,
} from 'src/modules/ethereum/transactions/types';
import { upsert } from 'src/shared/upsert';
import { getPendingTransactions } from 'src/modules/ethereum/transactions/model';
import { registerTransaction } from 'src/modules/defi-sdk/registerTransaction';
import { isLocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { getNetworkByChainId } from 'src/modules/networks/networks-api';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getLatestNonceKnownByBackend } from 'src/modules/ethereum/transactions/getLatestNonceKnownByBackend';
import type { Wallet } from 'src/shared/types/Wallet';
import { invariant } from 'src/shared/invariant';
import { getDefiSdkClient } from 'src/modules/defi-sdk/background';
import { emitter } from '../events';
import { INTERNAL_SYMBOL_CONTEXT } from '../Wallet/Wallet';
import { createMockTxResponse } from './mocks';
import type { PollingTx } from './TransactionPoller';
import { TransactionsPoller } from './TransactionPoller';

const FOUR_MINUTES_IN_MS = 1000 * 60 * 4;
const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const ONE_DAY_IN_MINUTES = 1 * 60 * 24;

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

  bulkDeleteTransactionsByHash(hashes: string[]) {
    const hashesSet = new Set(hashes);
    this.setState((state) => state.filter((item) => !hashesSet.has(item.hash)));
  }
}

function toPollingObj(value: TransactionObject): PollingTx {
  return {
    hash: value.hash,
    chainId: normalizeChainId(value.transaction.chainId),
    nonce: value.transaction.nonce,
    from: value.transaction.from,
  };
}

interface Options {
  getWallet: () => Wallet;
}

export class TransactionService {
  private transactionsStore: TransactionsStore;
  private transactionsPoller: TransactionsPoller;
  options: Options | null = null;

  static ALARM_NAME = 'TransactionService:performPurgeCheck';
  static emitter = createNanoEvents<{ alarm: () => void }>();

  static async scheduleAlarms() {
    const alarm = await browser.alarms.get(TransactionService.ALARM_NAME);
    // I think we should be able to safely create alarms with the same name
    // unconditionally and not worry about duplication, but chrome docs
    // have a recommendation to check if alarm already exists, so why not:
    // https://developer.chrome.com/docs/extensions/reference/api/alarms#persistence
    if (!alarm) {
      browser.alarms.create(TransactionService.ALARM_NAME, {
        periodInMinutes: ONE_DAY_IN_MINUTES,
      });
    }
  }

  static handleAlarm(alarm: browser.Alarms.Alarm) {
    if (alarm.name === TransactionService.ALARM_NAME) {
      TransactionService.emitter.emit('alarm');
    }
  }

  constructor() {
    this.transactionsStore = new TransactionsStore([], 'transactions');
    this.transactionsPoller = new TransactionsPoller();
    TransactionService.emitter.on('alarm', () => {
      // Just wondering... When a chrome alarm goes off, does this mean that
      // the whole background script runs from scratch? If it does, it means we
      // instantiate TransactionService anyway, and when we do, we {performPurgeCheck()} anyway...
      // So do we need a handler at all?
      // But if we don't add a handler, might chrome be "smart" and not run the alarm?
      // Documentation doesn't have answers for this.
      this.performPurgeCheck();
    });
  }

  async initialize(options: Options) {
    this.options = options;
    await this.transactionsStore.ready();
    const transactions = this.transactionsStore.getState();
    const pending = getPendingTransactions(transactions);
    this.transactionsPoller.setOptions({
      getRpcUrlByChainId: (chainId: ChainId) => {
        invariant(this.options, "Options aren't expected to become null");
        const wallet = this.options.getWallet();
        return wallet.getRpcUrlByChainId({ chainId, type: 'internal' });
      },
    });
    this.transactionsPoller.add(pending.map(toPollingObj));
    this.addListeners();
    if (transactions.length) {
      this.startPurgeInterval({ leading: true });
    }
  }

  private startPurgeInterval({ leading } = { leading: false }) {
    if (leading) {
      this.performPurgeCheck(); // make leading call
    }
    TransactionService.scheduleAlarms();
  }

  private schedulePurgeCheck = throttle(
    () => {
      this.performPurgeCheck();
    },
    FOUR_MINUTES_IN_MS,
    { leading: false } // Invoke no sooner and no more frequent than FOUR_MINUTES
  );

  /**
   * Purges from cache all transactions belonging to {address} in {chainId}
   * which have a nonce less than or equals to {fromNonce}
   */
  private async purgeEntries({
    address,
    fromNonce,
    chainId,
  }: {
    address: string;
    fromNonce: number;
    chainId: ChainId;
  }) {
    const transactions = await this.transactionsStore.getSavedState();
    const candidates = transactions.filter((item) => {
      return (
        normalizeAddress(item.transaction.from) === normalizeAddress(address) &&
        normalizeChainId(item.transaction.chainId) === chainId &&
        item.transaction.nonce <= fromNonce
      );
    });
    this.transactionsStore.bulkDeleteTransactionsByHash(
      candidates.map((item) => item.hash)
    );
  }

  /** Finds local transactions which our backend is aware of and removes them */
  private async performPurgeCheck() {
    const transactions = await this.transactionsStore.getSavedState();

    type Address = string;
    type Key = `${Address}:${ChainId}`;
    const map = new Map<Key, { hash: string; timestamp: number }>();

    for (const item of transactions) {
      const chainId = normalizeChainId(item.transaction.chainId);
      const key = `${item.transaction.from}:${chainId}` as const;
      map.set(key, { hash: item.hash, timestamp: item.timestamp });
    }

    const wallet = this.options?.getWallet();
    const preferences = await wallet?.getPreferences({
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    const client = getDefiSdkClient({
      on: Boolean(preferences?.testnetMode?.on),
    });

    for (const [key, { hash, timestamp }] of map.entries()) {
      const [address, chainIdStr] = key.split(':');
      const chainId = chainIdStr as ChainId;
      const network = await getNetworkByChainId(chainId, client);
      if (network?.supports_actions) {
        const knownNonce = await getLatestNonceKnownByBackend({
          address,
          hash,
          chain: network.id,
          // subtract one day to create a bigger search window
          // to account for possible client-time/server-time inconsistencies
          actions_since: new Date(timestamp - ONE_DAY_IN_MS - 1).toISOString(),
          client,
        });
        if (knownNonce != null) {
          this.purgeEntries({ address, chainId, fromNonce: knownNonce });
        }
      }
    }
  }

  private markAsDropped(item: TransactionObject | undefined) {
    if (item) {
      this.transactionsStore.upsertTransaction({ ...item, dropped: true });
    }
  }

  getTransactionsStore() {
    return this.transactionsStore;
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
        this.startPurgeInterval();
        this.schedulePurgeCheck();
      }
    );

    emitter.on('transactionSent', async ({ transaction, chain, mode }) => {
      registerTransaction(transaction, chain, mode);
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
          // There can be a transaction with "relatedTransactionHash" equal to currently mined one,
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
    clientScope: 'Local Testing',
    chain: 'ethereum',
    mode: 'default',
  });
}

export const transactionService = new TransactionService();
Object.assign(globalThis, { testAddTransaction });
