import { ethers, UnsignedTransaction } from 'ethers';
import { createNanoEvents, Emitter } from 'nanoevents';
import { produce } from 'immer';
import { Store } from 'store-unit';
import { encrypt, decrypt } from '@metamask/browser-passworder';
import { notificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import { ChannelContext } from 'src/shared/types/ChannelContext';
import {
  InvalidParams,
  OriginNotAllowed,
  UserRejected,
  UserRejectedTxSignature,
} from 'src/shared/errors/UserRejected';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import type { WalletStore } from './persistence';
import { walletStore } from './persistence';
import {
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
  PendingWallet,
  createOrUpdateRecord,
  getWalletByAddress,
  toEthersWallet,
} from './WalletRecord';
import type { WalletRecord } from './WalletRecord';
import { networksStore } from 'src/modules/networks/networks-store';
import { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import { createChain } from 'src/modules/networks/Chain';
import { emitter } from '../events';
import { getNextAccountPath } from 'src/shared/wallet/getNextAccountPath';

class RecordNotFound extends Error {}

type PublicMethodParams<T = undefined> = T extends undefined
  ? {
      context?: Partial<ChannelContext>;
    }
  : {
      params: T;
      context?: Partial<ChannelContext>;
    };

interface WalletEvents {
  recordUpdated: () => void;
  accountsChanged: (addresses: string[]) => void;
  chainChanged: (chainId: string) => void;
}

export class Wallet {
  public id: string;
  private encryptionKey: string | null;
  private walletStore: WalletStore;
  private pendingWallet: PendingWallet | null = null;
  private record: WalletRecord | null;

  private store: Store<{ chainId: string }>;

  emitter: Emitter<WalletEvents>;

  constructor(id: string, encryptionKey: string | null) {
    this.store = new Store({ chainId: '0x1' });
    this.emitter = createNanoEvents();

    this.id = id;
    this.walletStore = walletStore;
    this.encryptionKey = encryptionKey;
    this.record = null;

    this.walletStore.ready().then(() => {
      this.syncWithWalletStore();
    });
    Object.assign(window, { encrypt, decrypt });
  }

  private async syncWithWalletStore() {
    if (!this.encryptionKey) {
      return;
    }
    await walletStore.ready();
    this.record = await walletStore.read(this.id, this.encryptionKey);
    if (this.record) {
      this.emitter.emit('recordUpdated');
    }
  }

  private async updateWalletStore(record: WalletRecord) {
    if (!this.encryptionKey) {
      throw new Error('Cannot save pending wallet: encryptionKey is null');
    }
    this.walletStore.save(this.id, this.encryptionKey, record);
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
    this.pendingWallet = {
      groupId: null,
      walletContainer: new MnemonicWalletContainer(),
    };
    return this.pendingWallet.walletContainer.getFirstWallet();
  }

  async addMnemonicWallet({
    params: { groupId },
  }: PublicMethodParams<{ groupId: string }>) {
    const group = this.record?.walletManager.groups.find(
      (group) => group.id === groupId
    );
    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }
    if (!group.walletContainer.wallets.length) {
      throw new Error(
        `Existing group is expected to have at least one mnemonic wallet`
      );
    }
    const { wallets } = group.walletContainer;
    const lastMnemonic = wallets[wallets.length - 1].mnemonic;
    if (!lastMnemonic) {
      throw new Error(
        `Existing group is expected to have at least one mnemonic wallet`
      );
    }
    const mnemonic = {
      phrase: lastMnemonic.phrase,
      path: getNextAccountPath(lastMnemonic.path),
    };
    this.pendingWallet = {
      groupId,
      walletContainer: new MnemonicWalletContainer([{ mnemonic }]),
    };
    return this.pendingWallet.walletContainer.getFirstWallet();
  }

  async importPrivateKey({ params: privateKey }: PublicMethodParams<string>) {
    this.pendingWallet = {
      groupId: null,
      walletContainer: new PrivateKeyWalletContainer([{ privateKey }]),
    };
    return this.pendingWallet.walletContainer.getFirstWallet();
  }

  async importSeedPhrase({ params: seedPhrase }: PublicMethodParams<string>) {
    const mnemonic = { phrase: seedPhrase, path: ethers.utils.defaultPath };
    this.pendingWallet = {
      groupId: null,
      walletContainer: new MnemonicWalletContainer([{ mnemonic }]),
    };
    return this.pendingWallet.walletContainer.getFirstWallet();
  }

  async getRecoveryPhrase({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    const wallet = await this.getCurrentWallet();
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    console.log('mnemonic', wallet.mnemonic);
    return wallet.mnemonic;
  }

  async getCurrentWallet() {
    if (!this.id) {
      return null;
    }
    const currentAddress = this.readCurrentAddress();
    if (this.record && currentAddress) {
      return getWalletByAddress(this.record, currentAddress);
    }
    return null;
  }

  async savePendingWallet() {
    console.log('wallet.savePendingWallet');
    if (!this.pendingWallet) {
      throw new Error('Cannot save pending wallet: pendingWallet is null');
    }
    if (!this.encryptionKey) {
      throw new Error('Cannot save pending wallet: encryptionKey is null');
    }
    // const { seedType, wallet } = this.pendingWallet;
    // const record = createateRecord(this.record, this.pendingWallet);
    const record = createOrUpdateRecord(this.record, this.pendingWallet);
    // const record = createRecord({ walletContainer: { seedType, wallet } });
    this.record = record;
    console.log('wallet.savePendingWallet', record);
    this.updateWalletStore(record);
  }

  private async acceptOrigin(origin: string, address: string) {
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = produce(this.record, (draft) => {
      draft.permissions[origin] = address;
    });
    this.updateWalletStore(this.record);
  }

  private removeAllOrigins() {
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = produce(this.record, (draft) => {
      draft.permissions = {};
    });
    this.updateWalletStore(this.record);
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

  async setCurrentAddress({
    params: { address },
    context,
  }: PublicMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    const checkSumAddress = ethers.utils.getAddress(address);
    this.record = produce(this.record, (draft) => {
      draft.walletManager.currentAddress = checkSumAddress;
    });
    this.updateWalletStore(this.record);

    this.emitter.emit('accountsChanged', [checkSumAddress]);
  }

  async updateLastBackedUp({
    params: { groupId },
    context,
  }: PublicMethodParams<{ groupId: string }>) {
    if (!groupId) {
      throw new Error('Must provide groupId');
    }
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = produce(this.record, (draft) => {
      const group = draft.walletManager.groups.find(
        (group) => group.id === groupId
      );
      if (!group) {
        throw new Error(`Group with id ${groupId} not found`);
      }
      group.lastBackedUp = Date.now();
      // draft.lastBackedUp = Date.now();
    });
    this.updateWalletStore(this.record);
  }

  async getLastBackedUp({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    const hasUnBackedUpGroup = this.record.walletManager.groups.find(
      (group) => group.lastBackedUp == null
    );
    if (hasUnBackedUpGroup) {
      return null;
    } else {
      return (
        this.record.walletManager.groups
          .map((group) => group.lastBackedUp)
          .sort()[0] || null
      );
    }
    // return this.record.lastBackedUp;
  }

  async getNoBackupCount({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    return this.record.walletManager.groups.filter(
      (group) => group.lastBackedUp == null
    ).length;
  }

  async eth_accounts({ context }: PublicMethodParams) {
    const currentAddress = this.readCurrentAddress();
    if (!currentAddress) {
      return [];
    }
    // const wallet = this.record?.walletContainer?.wallet;
    if (this.allowedOrigin(context, currentAddress)) {
      return [currentAddress];
    } else {
      return [];
    }
  }

  private readCurrentAddress() {
    return this.record?.walletManager.currentAddress || null;
  }

  async getCurrentAddress({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    return this.readCurrentAddress();
  }

  async getWalletGroups({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    return this.record?.walletManager.groups || null;
  }

  async eth_requestAccounts({ context }: PublicMethodParams) {
    const currentAddress = this.readCurrentAddress();
    if (currentAddress && this.allowedOrigin(context, currentAddress)) {
      return [currentAddress];
    }
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
        onResolve: async () => {
          const currentAddress = this.readCurrentAddress();
          if (!currentAddress) {
            throw new Error('Wallet not found');
          }
          this.acceptOrigin(origin, currentAddress);
          const accounts = await this.eth_accounts({ context });
          resolve(accounts);
        },
        onDismiss: () => {
          reject(new UserRejected('User Rejected the Request'));
        },
      });
    });
  }

  async wallet_switchEthereumChain({
    params,
    context,
  }: PublicMethodParams<[{ chainId: string | number }]>): Promise<string> {
    const currentAddress = this.readCurrentAddress();
    if (!currentAddress) {
      throw new Error('Wallet is not initialized');
    }
    if (!this.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    const { origin } = context;
    const { chainId } = params[0];
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/switchEthereumChain',
        search: `?origin=${origin}&chainId=${chainId}`,
        onResolve: () => {
          const value = ethers.utils.hexValue(chainId);
          this.store.setState({ chainId: value });
          this.emitter.emit('chainChanged', value);
          resolve(value);
        },
        onDismiss: () => {
          reject(new UserRejected('User Rejected the Request'));
        },
      });
    });
  }

  private verifyInternalOrigin(context: Partial<ChannelContext> | undefined) {
    if (context?.origin !== INTERNAL_ORIGIN) {
      throw new OriginNotAllowed(context?.origin);
    }
  }

  async switchChain({ params: chain, context }: PublicMethodParams<string>) {
    if (context?.origin !== INTERNAL_ORIGIN) {
      // allow only for internal origin
      console.log({ INTERNAL_ORIGIN });
      throw new OriginNotAllowed(context?.origin);
    }
    const networks = await networksStore.load();
    const chainId = networks.getChainId(createChain(chain));
    this.store.setState({ chainId });
    this.emitter.emit('chainChanged', chainId);
  }

  async getChainId() {
    return this.store.getState().chainId;
  }

  private async getProvider(chainId: string) {
    const networks = await networksStore.load();
    const nodeUrl = networks.getRpcUrlInternal(networks.getChainById(chainId));
    return new ethers.providers.JsonRpcProvider(nodeUrl);
  }

  private async getSigner(chainId: string) {
    const currentWallet = await this.getCurrentWallet();
    if (!currentWallet) {
      throw new Error('Wallet is not initialized');
    }

    const jsonRpcProvider = await this.getProvider(chainId);
    const wallet = toEthersWallet(currentWallet);
    return wallet.connect(jsonRpcProvider);
  }

  private async sendTransaction(
    incomingTransaction: IncomingTransaction,
    context: Partial<ChannelContext> | undefined
  ): Promise<ethers.providers.TransactionResponse> {
    this.verifyInternalOrigin(context);
    if (!incomingTransaction.from) {
      throw new Error(
        '"from" field is missing from the transaction object. Send from current address?'
      );
    }
    const currentAddress = this.readCurrentAddress();
    if (!currentAddress) {
      throw new Error('Wallet is not initialized');
    }
    if (
      incomingTransaction.from.toLowerCase() !== currentAddress.toLowerCase()
    ) {
      throw new Error(
        'transaction "from" field is different from currently selected address. TODO?...'
      );
    }
    const { chainId } = this.store.getState();
    const targetChainId = ethers.utils.hexValue(
      incomingTransaction.chainId || '0x1'
    );
    if (chainId !== targetChainId) {
      await this.wallet_switchEthereumChain({
        params: [{ chainId: targetChainId }],
        context,
      });
      return this.sendTransaction(incomingTransaction, context);
    }
    // const networks = await networksStore.load();
    const transaction = prepareTransaction(incomingTransaction);

    // const { chainId = '0x1' } = transaction;
    const signer = await this.getSigner(chainId);
    // const nodeUrl = networks.getRpcUrlInternal(networks.getChainById(chainId));
    // const jsonRpcProvider = new ethers.providers.JsonRpcProvider(nodeUrl);
    // const signer = this.record.walletContainer.wallet.connect(jsonRpcProvider);
    // const populatedTransaction = await signer.populateTransaction({
    //   ...transaction,
    //   type: transaction.type || undefined,
    // });
    const transactionResponse = await signer.sendTransaction({
      ...transaction,
      type: transaction.type || undefined,
    });
    // this.savePendingTransaction(transactionResponse);
    emitter.emit('pendingTransactionCreated', transactionResponse);
    return transactionResponse;
    // return { signer, transaction, populatedTransaction, jsonRpcProvider };
  }

  async signAndSendTransaction({
    params,
    context,
  }: PublicMethodParams<IncomingTransaction[]>) {
    this.verifyInternalOrigin(context);
    const transaction = params[0];
    if (!transaction) {
      throw new InvalidParams();
    }
    return this.sendTransaction(transaction, context);
  }

  async eth_sendTransaction({
    params,
    context,
  }: PublicMethodParams<UnsignedTransaction[]>) {
    const currentAddress = this.readCurrentAddress();
    if (!currentAddress) {
      throw new Error('Wallet is not initialized');
    }
    // TODO: should we check transaction.from instead of currentAddress?
    if (!this.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    const transaction = params[0];
    if (!transaction) {
      throw new InvalidParams();
    }
    const { origin } = context;
    Object.assign(window, { transactionToSend: transaction });
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/sendTransaction',
        search: `?origin=${origin}&transaction=${encodeURIComponent(
          JSON.stringify(transaction)
        )}`,
        onResolve: (hash) => {
          console.log('result', hash);
          resolve(hash);
        },
        onDismiss: () => {
          reject(new UserRejectedTxSignature());
        },
      });
    });
  }

  async getPendingTransactions({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    return this.record?.transactions || [];
  }

  async logout() {
    chrome.storage.local.clear();
  }
}
