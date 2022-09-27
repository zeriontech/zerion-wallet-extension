import produce from 'immer';
import { PersistentStore } from 'src/shared/PersistentStore';
import type { WalletRecord } from './model/types';
import { WalletRecordModel as Model } from './WalletRecord';

type EncryptedWalletRecord = string;

type WalletStoreState = Record<string, EncryptedWalletRecord | undefined>;

export class WalletStore extends PersistentStore<WalletStoreState> {
  async read(id: string, encryptionKey: string): Promise<WalletRecord | null> {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      return null;
    }
    return await Model.decryptRecord(encryptionKey, encryptedRecord);
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

export const walletStore = new WalletStore('wallet', {});

Object.assign(window, { walletStore });
