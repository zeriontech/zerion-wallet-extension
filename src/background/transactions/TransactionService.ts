import browser from 'webextension-polyfill';
import { createNanoEvents } from 'nanoevents';
import { PersistentStore } from 'src/modules/persistent-store';
import { produce } from 'immer';
import type {
  StoredTransactions,
  TransactionObject,
} from 'src/modules/ethereum/transactions/types';
import { upsert } from 'src/shared/upsert';
import {
  getPendingTransactions,
  isPendingTransaction,
} from 'src/modules/ethereum/transactions/model';
import { registerTransaction } from 'src/modules/ethereum/transactions/registerTransaction';
import {
  isLocalAddressAction,
  type AnyAddressAction,
} from 'src/modules/ethereum/transactions/addressAction';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import {
  getNetworkByChainId,
  getNetworkById,
} from 'src/modules/networks/networks-api';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import {
  getExpiredTransactions,
  getTransactionNetworkKey,
  isExpiredTransaction,
  type TransactionNetworkKey,
} from 'src/modules/ethereum/transactions/getExpiredTransactions';
import type { Wallet } from 'src/shared/types/Wallet';
import { invariant } from 'src/shared/invariant';
import { ensureSolanaResult } from 'src/modules/shared/transactions/helpers';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import { emitter } from '../events';
import {
  toEthersV5Receipt,
  txPlainToEthersV5TransactionResponse,
} from '../Wallet/model/ethers-v5-types';
import type { PollingTx } from './TransactionPoller';
import { TransactionsPoller } from './TransactionPoller';
import {
  createSeedTransactions,
  DEV_SEED_INITIATOR,
} from './devSeedLocalTransactions';

const ONE_DAY_IN_MINUTES = 1 * 60 * 24;

class TransactionsStore extends PersistentStore<StoredTransactions> {
  upsertTransaction(value: TransactionObject) {
    this.setState((state) =>
      produce(state, (draft) => {
        upsert(draft, value, (x) => x.hash ?? x.signature);
      })
    );
  }

  getByHash(hash: string) {
    return this.getState().find((item) => item.hash === hash);
  }

  getBySignature(signature: string) {
    return this.getState().find((item) => item.signature === signature);
  }

  bulkDeleteTransactionsById(ids: string[]) {
    const idsSet = new Set(ids);
    this.setState((state) =>
      state.filter((item) => !idsSet.has(item.hash ?? item.signature))
    );
  }

  clearPendingTransactions() {
    this.setState((state) => state.filter((t) => !isPendingTransaction(t)));
  }

  bulkAddTransactions(values: TransactionObject[]) {
    this.setState((state) => [...state, ...values]);
  }

  removeTransactionsByInitiator(initiator: string) {
    this.setState((state) =>
      state.filter((item) => item.initiator !== initiator)
    );
  }
}

function toPollingObj(value: TransactionObject): PollingTx {
  if (value.transaction) {
    return {
      standard: 'evm',
      hash: value.hash,
      chainId: normalizeChainId(value.transaction.chainId),
      nonce: value.transaction.nonce,
      from: value.transaction.from,
    };
  } else if (value.solanaBase64) {
    return {
      standard: 'solana',
      from: value.publicKey,
      signature: value.signature,
      timestamp: value.timestamp,
    };
  } else {
    throw new Error('Invalid TransactionObject');
  }
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
      getRpcUrlSolana: async () => {
        invariant(this.options, "Options aren't expected to become null");
        const wallet = this.options.getWallet();
        try {
          return wallet.getRpcUrlSolana();
        } catch {
          return null;
        }
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

  /**
   * Whether the backend keeps history for the network behind {key}. Local
   * entries don't record which mode they were created in, so both sources are
   * asked: EIP-155 ids don't collide between them. Unknown networks and failed
   * lookups answer `false`, so their entries are kept until a later check.
   */
  private async networkHasHistory(key: TransactionNetworkKey) {
    const sources: NetworksSource[] = ['mainnet', 'testnet'];
    for (const source of sources) {
      try {
        const network =
          key === NetworkId.Solana
            ? await getNetworkById(key, { apiClient: ZerionAPI, source })
            : await getNetworkByChainId(key, { apiClient: ZerionAPI, source });
        if (network?.flags.supportsActions) {
          return true;
        }
      } catch {
        // Never delete on a failed lookup
      }
    }
    return false;
  }

  /**
   * Removes local transactions older than {LOCAL_TRANSACTION_TTL_MS} on
   * networks with backend history. This is purely local bookkeeping: History
   * already hides a local action once the backend returns its hash, so there is
   * no need to ask the backend about individual hashes (that used to be a
   * `wallet/get-actions` search per address and chain, which scans the whole
   * wallet history server-side).
   * Networks are only resolved when something has expired, so the common case
   * makes no requests.
   */
  private async performPurgeCheck() {
    const transactions = await this.transactionsStore.getSavedState();
    const now = Date.now();
    const keys = new Set(
      transactions
        .filter((item) => isExpiredTransaction(item, now))
        .map(getTransactionNetworkKey)
    );
    if (!keys.size) {
      return;
    }
    const networksWithHistory = new Set<TransactionNetworkKey>();
    for (const key of keys) {
      if (await this.networkHasHistory(key)) {
        networksWithHistory.add(key);
      }
    }
    const expired = getExpiredTransactions(transactions, {
      now,
      networksWithHistory,
    });
    if (expired.length) {
      this.transactionsStore.bulkDeleteTransactionsById(
        expired.map((item) => item.hash ?? item.signature)
      );
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

  static toTransactionObject(
    result: SignTransactionResult,
    {
      initiator,
      addressAction,
    }: { initiator: string; addressAction?: AnyAddressAction }
  ): TransactionObject {
    const timestamp = Date.now();
    if (result.evm) {
      return {
        transaction: txPlainToEthersV5TransactionResponse(result.evm),
        hash: result.evm.hash,
        initiator,
        timestamp,
        addressAction,
      };
    } else if (result.solana) {
      const solResult = ensureSolanaResult(result);
      return {
        solanaBase64: solResult.tx,
        signature: solResult.signature,
        publicKey: solResult.publicKey,
        signatureStatus: null,
        initiator,
        timestamp,
        addressAction,
      };
    } else {
      throw new Error('Unexpected result type');
    }
  }

  addListeners() {
    emitter.on('transactionSent', (result, { initiator, addressAction }) => {
      const newItem = TransactionService.toTransactionObject(result, {
        initiator,
        addressAction: addressAction ?? undefined,
      });
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
    });

    emitter.on('transactionSent', async (result, { chain, mode }) => {
      if (result.evm) {
        registerTransaction(result.evm, chain, mode);
      }
    });

    this.transactionsPoller.emitter.on('evm:mined', (receipt) => {
      const item = this.transactionsStore.getByHash(receipt.hash);
      if (item) {
        invariant(item.hash, 'Item must be evm');
        this.transactionsStore.upsertTransaction({
          ...item,
          receipt: toEthersV5Receipt(receipt),
        });
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
    this.transactionsPoller.emitter.on(
      'solana:mined',
      (signature, signatureStatus) => {
        const item = this.transactionsStore.getBySignature(signature);
        if (item) {
          invariant(item.signature, 'Item must be solana');
          this.transactionsStore.upsertTransaction({
            ...item,
            signatureStatus,
          });
        }
      }
    );
    this.transactionsPoller.emitter.on('evm:dropped', (hash) => {
      const item = this.transactionsStore.getByHash(hash);
      this.markAsDropped(item);
    });
    this.transactionsPoller.emitter.on('solana:dropped', (signature) => {
      const item = this.transactionsStore.getBySignature(signature);
      this.markAsDropped(item);
    });
  }

  async clearPendingTransactions() {
    await this.transactionsStore.ready();
    this.transactionsStore.clearPendingTransactions();
  }

  async devSeedLocalTransactions({
    address,
    count,
  }: {
    address: string;
    count: number;
  }) {
    await this.transactionsStore.ready();
    this.transactionsStore.bulkAddTransactions(
      createSeedTransactions({ address, count })
    );
  }

  async devClearSeededLocalTransactions() {
    await this.transactionsStore.ready();
    this.transactionsStore.removeTransactionsByInitiator(DEV_SEED_INITIATOR);
  }
}

export const transactionService = new TransactionService();
