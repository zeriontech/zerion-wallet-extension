import { ethers, UnsignedTransaction } from 'ethers';
import { createNanoEvents, Emitter } from 'nanoevents';
import { produce } from 'immer';
import { Store } from 'store-unit';
import { encrypt, decrypt } from '@metamask/browser-passworder';
import { notificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import { ChannelContext } from 'src/shared/types/ChannelContext';
import {
  InvalidParams,
  MethodNotImplemented,
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
  SeedType,
  removeWalletGroup,
  renameWalletGroup,
  renameAddress,
  removeAddress,
} from './WalletRecord';
import type { WalletRecord } from './WalletRecord';
import { networksStore } from 'src/modules/networks/networks-store';
import { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import { createChain } from 'src/modules/networks/Chain';
import { emitter } from '../events';
import { getNextAccountPath } from 'src/shared/wallet/getNextAccountPath';
import { toChecksumAddress } from 'src/modules/ethereum/toChecksumAddress';
import { hasGasPrice } from 'src/modules/ethereum/transactions/gasPrices/hasGasPrice';
import { fetchAndAssignGasPrice } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { prepareTypedData } from 'src/modules/ethereum/message-signing/prepareTypedData';
import { toUtf8String } from 'ethers/lib/utils';

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
  currentAddressChange: (addresses: string[]) => void;
  chainChanged: (chainId: string) => void;
  permissionsUpdated: () => void;
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

  async getRecoveryPhrase({
    params: { groupId },
    context,
  }: PublicMethodParams<{ groupId: string }>) {
    this.verifyInternalOrigin(context);
    const group = this.record?.walletManager.groups.find(
      (group) => group.id === groupId
    );
    if (!group) {
      throw new Error('Wallet Group not found');
    }
    return group.walletContainer.getMnemonic();
  }

  async getCurrentWallet({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    if (!this.id) {
      return null;
    }
    const currentAddress = this.readCurrentAddress();
    if (this.record && currentAddress) {
      return getWalletByAddress(this.record, currentAddress);
    }
    return null;
  }

  async getWalletByAddress({
    context,
    params: { address },
  }: PublicMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    if (!address) {
      throw new Error('Ilegal argument: address is required for this method');
    }
    return getWalletByAddress(this.record, address);
  }

  async savePendingWallet() {
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
    this.updateWalletStore(record);
  }

  private async acceptOrigin(origin: string, address: string) {
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = produce(this.record, (draft) => {
      const existingPermissions =
        typeof draft.permissions[origin] === 'string'
          ? [draft.permissions[origin] as unknown as string]
          : draft.permissions[origin];
      const existingPermissionsSet = new Set(existingPermissions || []);
      existingPermissionsSet.add(address);
      draft.permissions[origin] = Array.from(existingPermissionsSet);
    });
    this.updateWalletStore(this.record);
    this.emitter.emit('permissionsUpdated');
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
    return this.record?.permissions[context.origin]?.includes(address) || false;
  }

  async setCurrentAddress({
    params: { address },
    context,
  }: PublicMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    const checkSumAddress = toChecksumAddress(address);
    this.record = produce(this.record, (draft) => {
      draft.walletManager.currentAddress = checkSumAddress;
    });
    this.updateWalletStore(this.record);

    this.emitter.emit('currentAddressChange', [checkSumAddress]);
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
    // NOTE: deprecate this method?
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
    return this.record.walletManager.groups
      .filter((group) => group.walletContainer.seedType === SeedType.mnemonic)
      .filter((group) => group.lastBackedUp == null).length;
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

  async eth_chainId({ context }: PublicMethodParams) {
    const currentAddress = this.readCurrentAddress();
    if (currentAddress && this.allowedOrigin(context, currentAddress)) {
      return this.getChainId();
    } else {
      return '0x1';
    }
  }

  async net_version({ context }: PublicMethodParams) {
    const currentAddress = this.readCurrentAddress();
    if (currentAddress && this.allowedOrigin(context, currentAddress)) {
      const chainId = await this.getChainId();
      return String(parseInt(chainId));
    } else {
      return '1';
    }
  }

  private readCurrentAddress() {
    return this.record?.walletManager.currentAddress || null;
  }

  private ensureCurrentAddress(): string {
    const currentAddress = this.readCurrentAddress();
    if (!currentAddress) {
      throw new Error('Wallet is not initialized');
    }
    return currentAddress;
  }

  async getCurrentAddress({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    return this.readCurrentAddress();
  }

  async getWalletGroups({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    return this.record?.walletManager.groups || null;
  }

  async getWalletGroup({
    params: { groupId },
    context,
  }: PublicMethodParams<{ groupId: string }>) {
    this.verifyInternalOrigin(context);
    return (
      this.record?.walletManager.groups.find((group) => group.id === groupId) ||
      null
    );
  }

  async removeWalletGroup({
    params: { groupId },
    context,
  }: PublicMethodParams<{ groupId: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = removeWalletGroup(this.record, { groupId });
    this.updateWalletStore(this.record);
  }

  async renameWalletGroup({
    params: { groupId, name },
    context,
  }: PublicMethodParams<{ groupId: string; name: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = renameWalletGroup(this.record, { groupId, name });
    this.updateWalletStore(this.record);
  }

  async renameAddress({
    params: { address, name },
    context,
  }: PublicMethodParams<{ address: string; name: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = renameAddress(this.record, { address, name });
    this.updateWalletStore(this.record);
  }

  async removeAddress({
    params: { address },
    context,
  }: PublicMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = removeAddress(this.record, { address });
    this.updateWalletStore(this.record);
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
          const currentAddress = this.ensureCurrentAddress();
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
  }: PublicMethodParams<[{ chainId: string | number }]>): Promise<
    null | object
  > {
    const currentAddress = this.readCurrentAddress();
    if (!currentAddress) {
      throw new Error('Wallet is not initialized');
    }
    if (!this.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    const { origin } = context;
    const { chainId } = params[0];
    if (chainId === this.store.getState().chainId) {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/switchEthereumChain',
        search: `?origin=${origin}&chainId=${chainId}`,
        onResolve: () => {
          const value = ethers.utils.hexValue(chainId);
          this.store.setState({ chainId: value });
          resolve(null);
          this.emitter.emit('chainChanged', value);
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
    const currentAddress = this.readCurrentAddress();
    if (!this.record) {
      throw new RecordNotFound();
    }
    const currentWallet = currentAddress
      ? getWalletByAddress(this.record, currentAddress)
      : null;
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
    const currentAddress = this.ensureCurrentAddress();
    if (
      incomingTransaction.from.toLowerCase() !== currentAddress.toLowerCase()
    ) {
      throw new Error(
        // TODO?...
        'transaction "from" field is different from currently selected address'
      );
    }
    const { chainId } = this.store.getState();
    const targetChainId = incomingTransaction.chainId
      ? ethers.utils.hexValue(incomingTransaction.chainId)
      : null;
    if (targetChainId && chainId !== targetChainId) {
      await this.wallet_switchEthereumChain({
        params: [{ chainId: targetChainId }],
        context,
      });
      return this.sendTransaction(incomingTransaction, context);
    } else if (targetChainId == null) {
      console.warn('chainId field is missing from transaction object');
      incomingTransaction.chainId = chainId;
    }
    const transaction = prepareTransaction(incomingTransaction);
    if (!hasGasPrice(transaction)) {
      await fetchAndAssignGasPrice(transaction);
    }

    const signer = await this.getSigner(chainId);
    const transactionResponse = await signer.sendTransaction({
      ...transaction,
      type: transaction.type || undefined,
    });
    emitter.emit('pendingTransactionCreated', transactionResponse);
    return transactionResponse;
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
    const currentAddress = this.ensureCurrentAddress();
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
          resolve(hash);
        },
        onDismiss: () => {
          reject(new UserRejectedTxSignature());
        },
      });
    });
  }

  async signTypedData_v4({
    params: { typedData: rawTypedData },
    context,
  }: PublicMethodParams<{ typedData: TypedData | string }>) {
    this.verifyInternalOrigin(context);
    if (!rawTypedData) {
      throw new InvalidParams();
    }
    const { chainId } = this.store.getState();
    const signer = await this.getSigner(chainId);
    const typedData = prepareTypedData(rawTypedData);
    const signature = await signer._signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );
    return signature;
  }

  async eth_signTypedData_v4({
    context,
    params: [address, data],
  }: PublicMethodParams<[string, TypedData | string]>) {
    const currentAddress = this.ensureCurrentAddress();
    if (address.toLowerCase() !== currentAddress.toLowerCase()) {
      throw new Error(
        // TODO?...
        'Address parameter is different from currently selected address'
      );
    }
    if (!this.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    const stringifiedData =
      typeof data === 'string' ? data : JSON.stringify(data);
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/signMessage',
        search: `?${new URLSearchParams({
          origin,
          typedData: stringifiedData,
          method: 'eth_signTypedData_v4',
        })}`,
        onResolve: (signature) => {
          resolve(signature);
        },
        onDismiss: () => {
          reject(new UserRejectedTxSignature());
        },
      });
    });
  }

  async eth_signTypedData({ context: _context }: PublicMethodParams) {
    throw new MethodNotImplemented('eth_signTypedData: Not Implemented');
  }

  async eth_sign({ context: _context }: PublicMethodParams) {
    throw new MethodNotImplemented('eth_sign: Not Implemented');
  }

  async personalSign({
    params: [message],
    context,
  }: PublicMethodParams<[string, string?, string?]>) {
    this.verifyInternalOrigin(context);
    if (message == null) {
      throw new InvalidParams();
    }
    const { chainId } = this.store.getState();
    const signer = await this.getSigner(chainId);
    const messageAsUtf8String = toUtf8String(message);
    const signature = await signer.signMessage(messageAsUtf8String);
    return signature;
  }

  async personal_sign({
    params,
    context,
  }: PublicMethodParams<[string, string, string]>) {
    if (!params.length) {
      throw new InvalidParams();
    }
    const [message, address, _password] = params;
    const currentAddress = this.ensureCurrentAddress();
    if (address && address.toLowerCase() !== currentAddress.toLowerCase()) {
      throw new Error(
        // TODO?...
        'Address parameter is different from currently selected address'
      );
    }
    if (!this.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/signMessage',
        search: `?${new URLSearchParams({
          origin,
          message,
          method: 'personal_sign',
        })}`,
        onResolve: (signature) => {
          resolve(signature);
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
