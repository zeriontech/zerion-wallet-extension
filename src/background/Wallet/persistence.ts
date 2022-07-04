import { decrypt } from '@metamask/browser-passworder';
import { PersistentStore } from 'src/shared/PersistentStore';
import { get } from '../webapis/storage';
import {
  BareWalletContainer,
  encryptRecord,
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
  SeedType,
  WalletContainer,
  WalletRecord,
} from './WalletRecord';
import produce from 'immer';

type EncryptedWalletRecord = string;
export type WalletStoreState = Record<
  string,
  EncryptedWalletRecord | undefined
>;

export class WalletStore extends PersistentStore<WalletStoreState> {
  async read(
    id: string,
    encryptionKey: string
  ): Promise<WalletRecord<WalletContainer> | null> {
    const record = this.getState()[id];
    if (!record) {
      return null;
    }
    const data = await decrypt<WalletRecord<BareWalletContainer>>(
      encryptionKey,
      record
    );

    const { seedType, wallet } = data.walletContainer;
    if (seedType === SeedType.mnemonic) {
      if (!wallet.mnemonic) {
        throw new Error(
          'Mnemonic container is expected to have a wallet with a mnemonic'
        );
      }
      return {
        ...data,
        walletContainer: new MnemonicWalletContainer(wallet),
      };
    } else if (seedType === SeedType.privateKey) {
      return {
        ...data,
        walletContainer: new PrivateKeyWalletContainer(wallet),
      };
    } else {
      throw new Error(`Unexpected SeedType: ${seedType}`);
    }
  }

  async save(
    id: string,
    encryptionKey: string,
    record: WalletRecord<WalletContainer>
  ) {
    const encryptedRecord = await encryptRecord(encryptionKey, record);
    this.setState((state) =>
      produce(state, (draft) => {
        draft[id] = encryptedRecord;
      })
    );
  }
}

export const walletStore = new WalletStore('wallet', {});
// export const walletStore = new PersistentStore<WalletStoreState>('wallet', {});

export async function getWalletTable() {
  return get<WalletStoreState>('wallet');
}

Object.assign(window, { walletStore });
