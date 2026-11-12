import { produce } from 'immer';
import { PersistentStore } from 'src/modules/persistent-store';
import { createSerialQueue } from 'src/shared/createSerialQueue';
import type { Credentials } from '../account/Credentials';
import type { WalletRecord } from './model/types';
import { WalletRecordModel as Model } from './WalletRecord';

type EncryptedWalletRecord = string;

type WalletStoreState = Record<string, EncryptedWalletRecord | undefined>;

export class WalletStore extends PersistentStore<WalletStoreState> {
  static key = 'wallet';
  static backupKey = 'wallet-backup';
  /** Store unencrypted "lastRecord" to avoid unnecessary stringifications */
  private lastRecord: WalletRecord | null = null;
  /** Encryption is slow and async; without a queue, writes land in the order their encryptions finish */
  private enqueueWrite = createSerialQueue();

  constructor(initialState: WalletStoreState, key = WalletStore.key) {
    super(initialState, key);
  }

  /** throws if encryptionKey is wrong */
  async check(id: string, encryptionKey: string) {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      throw new Error(`Cannot read: record for ${id} not found`);
    }
    return Model.decryptRecord(encryptionKey, encryptedRecord);
  }

  async read(id: string, credentials: Credentials): Promise<WalletRecord | null> {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      return null;
    }
    this.lastRecord = await Model.decryptAndRestoreRecord(encryptedRecord, credentials);
    return this.lastRecord;
  }

  save(id: string, encryptionKey: string, record: WalletRecord): Promise<void> {
    return this.enqueueWrite(() => this.encryptAndStore(id, encryptionKey, record));
  }

  private async encryptAndStore(id: string, encryptionKey: string, record: WalletRecord) {
    if (this.lastRecord === record) {
      return;
    }
    const encryptedRecord = await Model.encryptRecord(encryptionKey, record);
    this.setState((state) =>
      produce(state, (draft) => {
        draft[id] = encryptedRecord;
      }),
    );
    this.lastRecord = record;
  }

  deleteMany(keys: string[]) {
    this.setState((state) =>
      produce(state, (draft) => {
        for (const key of keys) {
          delete draft[key];
        }
      }),
    );
    this.lastRecord = null;
  }
}

export function peakSavedWalletState(key = WalletStore.key) {
  return WalletStore.readSavedState<WalletStoreState>(key);
}
