import { PersistentStore } from 'src/shared/PersistentStore';
import { WalletRecord } from './WalletRecord';

export type WalletStoreState = Record<string, WalletRecord | undefined>;

export const walletStore = new PersistentStore<WalletStoreState>('wallet', {});
