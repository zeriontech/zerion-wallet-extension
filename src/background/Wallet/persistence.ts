import produce from 'immer';
import { PersistentStore } from 'src/shared/PersistentStore';
import { get } from '../webapis/storage';
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
}

export const walletStore = new WalletStore('wallet', {});

export async function getWalletTable() {
  return get<WalletStoreState>('wallet');
}

Object.assign(window, { walletStore });
