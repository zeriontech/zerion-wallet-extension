import { PersistentStore } from 'src/shared/PersistentStore';
import { get } from '../webapis/storage';

type EncryptedWalletRecord = string;
export type WalletStoreState = Record<
  string,
  EncryptedWalletRecord | undefined
>;

export const walletStore = new PersistentStore<WalletStoreState>('wallet', {});

export async function getWalletTable() {
  return get<WalletStoreState>('wallet');
}

Object.assign(window, { walletStore });
