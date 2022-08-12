import { PersistentStore } from 'src/shared/PersistentStore';
import { get } from '../webapis/storage';
import { decryptRecord, encryptRecord, WalletRecord } from './WalletRecord';
import produce from 'immer';

type EncryptedWalletRecord = string;

type WalletStoreState = Record<string, EncryptedWalletRecord | undefined>;

export class WalletStore extends PersistentStore<WalletStoreState> {
  async read(id: string, encryptionKey: string): Promise<WalletRecord | null> {
    const encryptedRecord = this.getState()[id];
    if (!encryptedRecord) {
      return null;
    }
    return await decryptRecord(encryptionKey, encryptedRecord);
  }

  async save(id: string, encryptionKey: string, record: WalletRecord) {
    const encryptedRecord = await encryptRecord(encryptionKey, record);
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
