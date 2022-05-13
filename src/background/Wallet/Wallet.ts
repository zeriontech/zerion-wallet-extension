import { ethers, UnsignedTransaction } from 'ethers';
import { produce } from 'immer';
import { encrypt, decrypt } from '@metamask/browser-passworder';
import { notificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import { ChannelContext } from 'src/shared/types/ChannelContext';
import { PersistentStore } from 'src/shared/PersistentStore';
import {
  InvalidParams,
  OriginNotAllowed,
  UserRejected,
} from 'src/shared/errors/UserRejected';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { WalletStoreState } from './persistence';
import { createEmptyRecord } from './WalletRecord';
import type { WalletRecord } from './WalletRecord';
import { walletStore } from './persistence';

export interface BareWallet {
  mnemonic: ethers.Wallet['mnemonic'];
  privateKey: ethers.Wallet['privateKey'];
  publicKey: ethers.Wallet['publicKey'];
  address: ethers.Wallet['address'];
}

function walletToObject(wallet: ethers.Wallet | BareWallet): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    address: wallet.address,
  };
}

function toPlainObject(record: WalletRecord) {
  return {
    wallet: record.wallet ? walletToObject(record.wallet) : null,
    permissions: record.permissions,
  };
}

async function encryptRecord(key: string, record: WalletRecord) {
  return encrypt(key, toPlainObject(record));
}

class RecordNotFound extends Error {}
class EncryptionKeyNotFound extends Error {}

type PublicMethodParams<T = undefined> = T extends undefined
  ? {
      context?: Partial<ChannelContext>;
    }
  : {
      params: T;
      context?: Partial<ChannelContext>;
    };

export class Wallet {
  public id: string;
  private encryptionKey: string | null;
  private walletStore: PersistentStore<WalletStoreState>;
  private pendingWallet: BareWallet | null = null;
  // private wallet: ethers.Wallet | null = null;
  private record: WalletRecord | null;

  constructor(id: string, encryptionKey: string | null) {
    this.id = id;
    this.walletStore = walletStore;
    this.encryptionKey = encryptionKey;
    this.record = null;

    this.walletStore.ready().then(() => {
      this.syncWithWalletStore();
      this.walletStore.on('change', () => {
        this.syncWithWalletStore();
      });
    });
    Object.assign(window, { encrypt, decrypt });
  }

  private async syncWithWalletStore() {
    if (!this.encryptionKey) {
      return;
    }
    const record = walletStore.getState()[this.id];
    if (!record) {
      return;
    }
    const data = await decrypt<WalletRecord>(this.encryptionKey, record);
    if (data.wallet) {
      console.log('syncing with data:', data);
      this.record = {
        wallet: ethers.Wallet.fromMnemonic(
          data.wallet.mnemonic.phrase,
          data.wallet.mnemonic.path
        ),
        permissions: data.permissions,
      };
    } else {
      this.record = null;
    }
  }

  async ready() {
    return this.walletStore.ready();
  }

  async getId() {
    return this.id;
  }

  async updateId({ params: id }: PublicMethodParams<string>) {
    this.id = id;
    await walletStore.ready();
    await this.syncWithWalletStore();
  }

  async updateEncryptionKey({ params: key }: PublicMethodParams<string>) {
    this.encryptionKey = key;
    await walletStore.ready();
    await this.syncWithWalletStore();
  }

  async testMethod({ params: value }: PublicMethodParams<number>) {
    return new Promise<string>((r) => setTimeout(() => r(String(value)), 1500));
  }

  async generateMnemonic() {
    console.log('generateMnemonic', this.id, this);
    const wallet = ethers.Wallet.createRandom();
    this.pendingWallet = wallet;
    return wallet;
  }

  async getCurrentWallet() {
    if (!this.id) {
      return null;
    }
    return this.record?.wallet;
    // await this.walletStore.ready();
    // return this.getWalletFromStore();
  }

  async savePendingWallet() {
    const { pendingWallet } = this;
    if (!pendingWallet) {
      throw new Error('Cannot save pending wallet: pendingWallet is null');
    }
    if (!this.encryptionKey) {
      throw new Error('Cannot save pending wallet: encryptionKey is null');
    }
    const record = createEmptyRecord();
    record.wallet = {
      mnemonic: pendingWallet.mnemonic,
      privateKey: pendingWallet.privateKey,
      publicKey: pendingWallet.publicKey,
      address: pendingWallet.address,
    };
    this.record = record;
    console.log('saving record');
    const encryptedRecord = await encryptRecord(this.encryptionKey, record);
    this.walletStore.setState((state) =>
      produce(state, (draft) => {
        draft[this.id] = encryptedRecord;
      })
    );
  }

  private async acceptOrigin(origin: string, address: string) {
    if (!this.encryptionKey) {
      throw new EncryptionKeyNotFound();
    }
    if (!this.record) {
      throw new RecordNotFound();
    }
    const updatedRecord = produce(this.record, (draft) => {
      draft.permissions[origin] = address;
    });
    const encryptedRecord = await encryptRecord(
      this.encryptionKey,
      updatedRecord
    );
    this.walletStore.setState((state) =>
      produce(state, (draft) => {
        draft[this.id] = encryptedRecord;
      })
    );
  }

  private allowedOrigin(
    context: Partial<ChannelContext> | undefined,
    address: string
  ): context is ChannelContext {
    if (!context || !context.origin) {
      throw new Error('This method requires context');
    }
    if (context.origin === INTERNAL_ORIGIN) {
      return true;
    }
    return this.record?.permissions[context.origin] === address;
  }

  async eth_accounts({ context }: PublicMethodParams) {
    if (!this.record) {
      return [];
    }
    const { wallet } = this.record;
    if (wallet && this.allowedOrigin(context, wallet.address)) {
      return wallet ? [wallet.address] : [];
    } else {
      return [];
    }
  }

  async eth_requestAccounts({ context }: PublicMethodParams) {
    // if (
    //   this.record?.wallet &&
    //   this.allowedOrigin(context, this.record.wallet.address)
    // ) {
    //   return [this.record.wallet.address];
    // }
    if (!context?.origin) {
      throw new Error('This method requires origin');
    }
    // if (!this.wallet) {
    //   console.log('Must create wallet first');
    //   throw new Error('Must create wallet first');
    // }
    const { origin } = context;
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/requestAccounts',
        search: `?origin=${origin}`,
        onResolve: (result) => {
          if (!this.record?.wallet) {
            throw new Error('Wallet not found');
          }
          this.acceptOrigin(origin, this.record.wallet.address);
          resolve(result);
        },
        onDismiss: () => {
          reject(new UserRejected('User Rejected the Request'));
        },
      });
    });
  }

  async eth_sendTransaction({
    params,
    context,
  }: PublicMethodParams<UnsignedTransaction[]>) {
    if (!this.record?.wallet) {
      throw new Error('Wallet is not initialized');
    }
    if (!this.allowedOrigin(context, this.record.wallet.address)) {
      throw new OriginNotAllowed();
    }
    const transaction = params[0];
    if (!transaction) {
      throw new InvalidParams();
    }
    const { origin } = context;
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/sendTransaction',
        search: `?origin=${origin}&transaction=${encodeURIComponent(
          JSON.stringify(transaction)
        )}`,
        onResolve: (result) => {
          console.log('result', result);
          resolve('0x123123');
        },
        onDismiss: () => {
          reject(new UserRejected('User Rejected the Request'));
        },
      });
    });
  }

  async logout() {
    chrome.storage.local.clear();
  }
}
