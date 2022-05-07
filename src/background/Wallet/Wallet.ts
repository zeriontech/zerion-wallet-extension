import { ethers } from 'ethers';
import { produce } from 'immer';
import { notificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import { ChannelContext } from 'src/shared/types/ChannelContext';
import { PersistentStore } from 'src/shared/PersistentStore';
import { UserRejected } from 'src/shared/errors/UserRejected';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { WalletStoreState } from './persistence';
import { createEmptyRecord } from './WalletRecord';

export interface BareWallet {
  mnemonic: ethers.Wallet['mnemonic'];
  privateKey: ethers.Wallet['privateKey'];
  publicKey: ethers.Wallet['publicKey'];
  address: ethers.Wallet['address'];
}

type PublicMethodParams<T = undefined> = T extends undefined
  ? {
      context?: Partial<ChannelContext>;
    }
  : {
      params: T;
      context?: Partial<ChannelContext>;
    };

export class Wallet {
  private id: string;
  private walletStore: PersistentStore<WalletStoreState>;
  private pendingWallet: BareWallet | null = null;
  private wallet: ethers.Wallet | null = null;

  constructor(id: string, walletStore: PersistentStore<WalletStoreState>) {
    this.id = id;
    this.walletStore = walletStore;
    walletStore.ready().then(() => {
      const record = walletStore.getState()[id];
      if (record && record.wallet) {
        const { wallet } = record;
        this.wallet = ethers.Wallet.fromMnemonic(
          wallet.mnemonic.phrase,
          wallet.mnemonic.path
        );
      }
      walletStore.on('change', (state) => {
        const record = state[id];
        if (record && record.wallet) {
          const { wallet } = record;
          this.wallet = ethers.Wallet.fromMnemonic(
            wallet.mnemonic.phrase,
            wallet.mnemonic.path
          );
        } else {
          this.wallet = null;
        }
      });
    });
  }

  async testMethod({ params: value }: PublicMethodParams<number>) {
    return new Promise<string>((r) => setTimeout(() => r(String(value)), 1500));
  }

  async generateMnemonic() {
    const wallet = ethers.Wallet.createRandom();
    this.pendingWallet = wallet;
    return wallet;
  }

  async getCurrentWallet() {
    return this.wallet;
  }

  async savePendingWallet() {
    const { pendingWallet } = this;
    if (!pendingWallet) {
      throw new Error('Cannot save pending wallet: pendingWallet is null');
    }
    this.walletStore.setState((state) =>
      produce(state, (draft) => {
        const record = draft[this.id] || createEmptyRecord();
        record.wallet = {
          mnemonic: pendingWallet.mnemonic,
          privateKey: pendingWallet.privateKey,
          publicKey: pendingWallet.publicKey,
          address: pendingWallet.address,
        };
        draft[this.id] = record;
      })
    );
    return 2;
  }

  private acceptOrigin(origin: string, address: string) {
    this.walletStore.setState((state) =>
      produce(state, (draft) => {
        const record = draft[this.id];
        if (!record) {
          throw new Error(`Record for ${this.id} not found`);
        }
        record.permissions[origin] = address;
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
    return (
      this.walletStore.getState()[this.id]?.permissions[context.origin] ===
      address
    );
    // return false;
    // return context.origin === 'http://localhost:3000';
  }

  async eth_accounts({ context }: PublicMethodParams) {
    if (this.wallet && this.allowedOrigin(context, this.wallet.address)) {
      return this.wallet ? [this.wallet.address] : [];
    } else {
      return [];
    }
  }

  async eth_requestAccounts({ context }: PublicMethodParams) {
    console.log('wallet: eth_requestAccounts');
    if (this.wallet && this.allowedOrigin(context, this.wallet.address)) {
      console.log('allowedOrigin', this.wallet.address);
      return [this.wallet.address];
    }
    if (!context?.origin) {
      console.log('This method requires origin');
      throw new Error('This method requires origin');
    }
    // if (!this.wallet) {
    //   console.log('Must create wallet first');
    //   throw new Error('Must create wallet first');
    // }
    const { origin } = context;
    console.log('will notificationWindow open');
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/requestAccounts',
        search: `?origin=${origin}`,
        onResolve: (result) => {
          if (!this.wallet) {
            throw new Error('Wallet not found');
          }
          this.acceptOrigin(origin, this.wallet.address);
          resolve(result);
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
