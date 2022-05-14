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
import {
  ContainerType,
  createEmptyRecord,
  WalletContainer,
} from './WalletRecord';
import type { WalletRecord } from './WalletRecord';
import { walletStore } from './persistence';

export interface BareWallet {
  mnemonic: ethers.Wallet['mnemonic'] | null;
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
    walletContainer: record.walletContainer
      ? {
          type: record.walletContainer.type,
          wallet: walletToObject(record.walletContainer.wallet),
        }
      : null,
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
  private pendingWallet: WalletContainer | null = null;
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
    if (data.walletContainer) {
      console.log('syncing with data:', data);
      const { type, wallet } = data.walletContainer;
      if (type === ContainerType.mnemonic) {
        if (!wallet.mnemonic) {
          throw new Error(
            'Mnemonic container is expected to have a wallet with a mnemonic'
          );
        }
        this.record = {
          walletContainer: {
            type: ContainerType.mnemonic,
            wallet: ethers.Wallet.fromMnemonic(
              wallet.mnemonic.phrase,
              wallet.mnemonic.path
            ),
          },
          permissions: data.permissions,
        };
      } else if (type === ContainerType.privateKey) {
        this.record = {
          walletContainer: {
            type: ContainerType.mnemonic,
            wallet: new ethers.Wallet(wallet.privateKey),
          },
          permissions: data.permissions,
        };
      } else {
        throw new Error(`Unexpected ContainerType: ${type}`);
      }
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
    this.pendingWallet = {
      type: ContainerType.mnemonic,
      wallet,
    };
    return wallet;
  }

  async importPrivateKey({ params: privateKey }: PublicMethodParams<string>) {
    const wallet = new ethers.Wallet(privateKey);
    this.pendingWallet = {
      type: ContainerType.privateKey,
      wallet,
    };
    return wallet;
  }

  async getCurrentWallet() {
    if (!this.id) {
      return null;
    }
    return this.record?.walletContainer?.wallet;
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
    const { type, wallet } = pendingWallet;
    record.walletContainer = {
      type,
      wallet: {
        mnemonic: wallet.mnemonic,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address,
      },
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
    const wallet = this.record?.walletContainer?.wallet;
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
          if (!this.record?.walletContainer) {
            throw new Error('Wallet not found');
          }
          this.acceptOrigin(origin, this.record.walletContainer.wallet.address);
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
    if (!this.record?.walletContainer) {
      throw new Error('Wallet is not initialized');
    }
    if (
      !this.allowedOrigin(context, this.record.walletContainer.wallet.address)
    ) {
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
