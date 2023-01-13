import produce from 'immer';
import { Store } from 'store-unit';
import * as browserStorage from 'src/background/webapis/storage';
import type { WalletRecord } from './model/types';
import { WalletRecordModel as Model } from './WalletRecord';

type EncryptedWalletRecord = string;

type WalletStoreState = Record<string, EncryptedWalletRecord | undefined>;

export class WalletStore extends Store<WalletStoreState> {
  private key: string;
  private isReady: boolean;
  private readyPromise: Promise<void>;

  static async readSavedState(key = 'wallet') {
    return browserStorage.get<WalletStoreState>(key);
  }

  constructor(initialState: WalletStoreState, key = 'wallet') {
    super(initialState);
    this.key = key;
    this.isReady = false;
    this.readyPromise = this.restore();
    this.on('change', (state) => {
      browserStorage.set(this.key, state);
    });
  }

  async restore() {
    const saved = await browserStorage.get<WalletStoreState>(this.key);
    if (saved) {
      this.setState(saved);
    }
    this.isReady = true;
  }

  async ready(): Promise<void> {
    return this.isReady ? Promise.resolve() : this.readyPromise;
  }

  async getSavedState() {
    await this.ready();
    return this.getState();
  }

  /** throws if encryptionKey is wrong */
  async check(id: string, encryptionKey: string) {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      throw new Error(`Cannot read: record for ${id} not found`);
    }
    return Model.decryptRecord(encryptionKey, encryptedRecord);
  }

  async read(id: string, encryptionKey: string): Promise<WalletRecord | null> {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      return null;
    }
    return await Model.decryptAndRestoreRecord(encryptionKey, encryptedRecord);
  }

  async save(id: string, encryptionKey: string, record: WalletRecord) {
    const encryptedRecord = await Model.encryptRecord(encryptionKey, record);
    this.setState((state) =>
      produce(state, (draft) => {
        draft[id] = encryptedRecord;
      })
    );
  }

  deleteMany(keys: string[]) {
    this.setState((state) =>
      produce(state, (draft) => {
        for (const key of keys) {
          delete draft[key];
        }
      })
    );
  }
}
