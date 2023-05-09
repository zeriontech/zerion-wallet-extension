import type { UnsignedTransaction } from 'ethers';
import { ethers } from 'ethers';
import type { Emitter } from 'nanoevents';
import { createNanoEvents } from 'nanoevents';
import { Store } from 'store-unit';
import { isTruthy } from 'is-truthy-ts';
import { encrypt, decrypt } from 'src/modules/crypto';
import { notificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import type {
  ChannelContext,
  PrivateChannelContext,
} from 'src/shared/types/ChannelContext';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import {
  InvalidParams,
  MethodNotImplemented,
  OriginNotAllowed,
  RecordNotFound,
  SessionExpired,
  UserRejected,
  UserRejectedTxSignature,
} from 'src/shared/errors/errors';
import {
  INTERNAL_ORIGIN,
  INTERNAL_ORIGIN_SYMBOL,
} from 'src/background/constants';
import { networksStore } from 'src/modules/networks/networks-store.background';
import type { IncomingTransaction } from 'src/modules/ethereum/types/IncomingTransaction';
import { prepareTransaction } from 'src/modules/ethereum/transactions/prepareTransaction';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { hasGasPrice } from 'src/modules/ethereum/transactions/gasPrices/hasGasPrice';
import { fetchAndAssignGasPrice } from 'src/modules/ethereum/transactions/fetchAndAssignGasPrice';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import { prepareTypedData } from 'src/modules/ethereum/message-signing/prepareTypedData';
import { toUtf8String } from 'src/modules/ethereum/message-signing/toUtf8String';
import { removeSignature } from 'src/modules/ethereum/transactions/removeSignature';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getTransactionChainId } from 'src/modules/ethereum/transactions/resolveChainForTx';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { flagAsDapp, isFlaggedAsDapp } from 'src/shared/dapps';
import { isKnownDapp } from 'src/shared/dapps/known-dapps';
import type { WalletAbility } from 'src/shared/types/Daylight';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import { chainConfigStore } from 'src/modules/ethereum/chains/ChainConfigStore';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { isSiweLike } from 'src/modules/ethereum/message-signing/SIWE';
import { getRemoteConfigValue } from 'src/modules/remote-config';
import omit from 'lodash/omit';
import type { DaylightEventParams, ScreenViewParams } from '../events';
import { emitter } from '../events';
import { toEthersWallet } from './helpers/toEthersWallet';
import { maskWallet, maskWalletGroup, maskWalletGroups } from './helpers/mask';
import { SeedType } from './model/SeedType';
import type { BareWallet, PendingWallet, WalletRecord } from './model/types';
import {
  MnemonicWalletContainer,
  PrivateKeyWalletContainer,
} from './model/WalletContainer';
import { WalletRecordModel as Model } from './WalletRecord';
import { WalletStore } from './persistence';
import type { WalletNameFlag } from './model/WalletNameFlag';
import { WalletOrigin } from './model/WalletOrigin';
import { GlobalPreferences } from './GlobalPreferences';
import type { State as GlobalPreferencesState } from './GlobalPreferences';

const INTERNAL_SYMBOL_CONTEXT = { origin: INTERNAL_ORIGIN_SYMBOL };

type PublicMethodParams<T = undefined> = T extends undefined
  ? {
      context?: Partial<ChannelContext>;
    }
  : {
      params: T;
      context?: Partial<ChannelContext>;
    };

type WalletMethodParams<T = undefined> = T extends undefined
  ? {
      context?: Partial<ChannelContext | PrivateChannelContext>;
    }
  : {
      params: T;
      context?: Partial<ChannelContext | PrivateChannelContext>;
    };

interface WalletEvents {
  recordUpdated: () => void;
  currentAddressChange: (addresses: string[]) => void;
  chainChanged: (chain: Chain, origin: string) => void;
  permissionsUpdated: () => void;
}

export class Wallet {
  public id: string;
  // eslint-disable-next-line no-use-before-define
  public publicEthereumController: PublicController;
  private encryptionKey: string | null;
  private seedPhraseEncryptionKey: CryptoKey | null;
  private seedPhraseExpiryTimerId: NodeJS.Timeout | number = 0;
  private globalPreferences: GlobalPreferences;
  private pendingWallet: PendingWallet | null = null;
  private record: WalletRecord | null;

  private store: Store<{ chainId: string }>;

  walletStore: WalletStore;

  emitter: Emitter<WalletEvents>;

  constructor(id: string, encryptionKey: string | null) {
    this.store = new Store({ chainId: '0x1' });
    this.emitter = createNanoEvents();

    this.id = id;
    this.walletStore = new WalletStore({}, 'wallet');
    this.globalPreferences = new GlobalPreferences({}, 'globalPreferences');
    networksStore.on('change', () => {
      this.verifyOverviewChain();
    });
    this.encryptionKey = encryptionKey;
    this.seedPhraseEncryptionKey = null;
    this.record = null;

    this.walletStore.ready().then(() => {
      this.syncWithWalletStore();
    });
    Object.assign(globalThis, { encrypt, decrypt });
    this.publicEthereumController = new PublicController(this);
  }

  private async syncWithWalletStore() {
    if (!this.encryptionKey) {
      return;
    }
    await this.walletStore.ready();
    this.record = await this.walletStore.read(this.id, this.encryptionKey);
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

  async userHeartbeat({ context }: WalletMethodParams) {
    this.verifyInternalOrigin(context);
    emitter.emit('userActivity');
  }

  /** throws if encryptionKey is wrong */
  async verifyCredentials({
    params: { id, encryptionKey },
  }: PublicMethodParams<{ id: string; encryptionKey: string }>) {
    await this.walletStore.ready();
    await this.walletStore.check(id, encryptionKey);
  }

  hasSeedPhraseEncryptionKey() {
    return Boolean(this.seedPhraseEncryptionKey);
  }

  removeSeedPhraseEncryptionKey() {
    this.seedPhraseEncryptionKey = null;
  }

  private setExpirationForSeedPhraseEncryptionKey() {
    clearTimeout(this.seedPhraseExpiryTimerId);
    this.seedPhraseExpiryTimerId = setTimeout(() => {
      if (this) {
        this.removeSeedPhraseEncryptionKey();
      }
    }, 1000 * 120);
  }

  async updateCredentials({
    params: { id, encryptionKey, seedPhraseEncryptionKey },
  }: PublicMethodParams<{
    id: string;
    encryptionKey: string;
    seedPhraseEncryptionKey: CryptoKey | null;
  }>) {
    this.id = id;
    this.encryptionKey = encryptionKey;
    this.seedPhraseEncryptionKey = seedPhraseEncryptionKey;
    this.setExpirationForSeedPhraseEncryptionKey();
    await this.walletStore.ready();
    await this.syncWithWalletStore();
  }

  async testMethod({ params: value }: WalletMethodParams<number>) {
    return new Promise<string>((r) =>
      setTimeout(
        () => r(`Hello, curious developer. Your value is ${value}`),
        1500
      )
    );
  }

  // TODO: For now, I prefix methods with "ui" which return wallet data and are supposed to be called
  // from the UI (extension popup) thread. It's maybe better to refactor them
  // into a separate isolated class
  async uiGenerateMnemonic() {
    if (!this.seedPhraseEncryptionKey) {
      throw new SessionExpired();
    }
    this.pendingWallet = {
      origin: WalletOrigin.extension,
      groupId: null,
      walletContainer: await MnemonicWalletContainer.create({
        encryptionKey: this.seedPhraseEncryptionKey,
      }),
    };
    return maskWallet(this.pendingWallet.walletContainer.getFirstWallet());
  }

  async uiImportPrivateKey({ params: privateKey }: WalletMethodParams<string>) {
    this.pendingWallet = {
      origin: WalletOrigin.imported,
      groupId: null,
      walletContainer: new PrivateKeyWalletContainer([{ privateKey }]),
    };
    return maskWallet(this.pendingWallet.walletContainer.getFirstWallet());
  }

  async uiImportSeedPhrase({
    params: mnemonics,
  }: WalletMethodParams<NonNullable<BareWallet['mnemonic']>[]>) {
    if (!this.seedPhraseEncryptionKey) {
      throw new SessionExpired();
    }
    this.pendingWallet = {
      origin: WalletOrigin.imported,
      groupId: null,
      walletContainer: await MnemonicWalletContainer.create({
        wallets: mnemonics.map((mnemonic) => ({ mnemonic })),
        encryptionKey: this.seedPhraseEncryptionKey,
      }),
    };
    return maskWallet(this.pendingWallet.walletContainer.getFirstWallet());
  }

  async getRecoveryPhrase({
    params: { groupId },
    context,
  }: WalletMethodParams<{ groupId: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    if (!this.seedPhraseEncryptionKey) {
      throw new SessionExpired();
    }
    return await Model.getRecoveryPhrase(this.record, {
      groupId,
      encryptionKey: this.seedPhraseEncryptionKey,
    });
  }

  async verifyRecoveryPhrase({
    params: { groupId, value },
    context,
  }: WalletMethodParams<{ groupId: string; value: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    if (!this.seedPhraseEncryptionKey) {
      throw new SessionExpired();
    }
    const mnemonic = await Model.getRecoveryPhrase(this.record, {
      groupId,
      encryptionKey: this.seedPhraseEncryptionKey,
    });
    return mnemonic.phrase === value;
  }

  async getPrivateKey({
    params: { address },
    context,
  }: WalletMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    if (!this.seedPhraseEncryptionKey) {
      throw new SessionExpired();
    }
    return await Model.getPrivateKey(this.record, { address });
  }

  async verifyPrivateKey({
    params: { address, value },
    context,
  }: WalletMethodParams<{ address: string; value: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    if (!this.seedPhraseEncryptionKey) {
      throw new SessionExpired();
    }
    const privateKey = await Model.getPrivateKey(this.record, { address });
    return privateKey === value;
  }

  async uiGetCurrentWallet({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    if (!this.id) {
      return null;
    }
    const currentAddress = this.readCurrentAddress();
    if (this.record && currentAddress) {
      const wallet =
        Model.getWalletByAddress(this.record, currentAddress) ||
        Model.getFirstWallet(this.record);
      return wallet ? maskWallet(wallet) : null;
    }
    return null;
  }

  async uiGetWalletByAddress({
    context,
    params: { address },
  }: WalletMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    if (!address) {
      throw new Error('Ilegal argument: address is required for this method');
    }
    const wallet = Model.getWalletByAddress(this.record, address);
    return wallet ? maskWallet(wallet) : null;
  }

  async savePendingWallet() {
    if (!this.pendingWallet) {
      throw new Error('Cannot save pending wallet: pendingWallet is null');
    }
    if (!this.encryptionKey) {
      throw new Error('Cannot save pending wallet: encryptionKey is null');
    }
    emitter.emit('walletCreated', this.pendingWallet);
    this.record = Model.createOrUpdateRecord(this.record, this.pendingWallet);
    this.pendingWallet = null;
    this.seedPhraseEncryptionKey = null;
    this.updateWalletStore(this.record);
  }

  async acceptOrigin({
    params: { origin, address },
    context,
  }: WalletMethodParams<{ origin: string; address: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.addPermission(this.record, { address, origin });
    this.updateWalletStore(this.record);
    this.emitter.emit('permissionsUpdated');
  }

  async removeAllOriginPermissions({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.removeAllOriginPermissions(this.record);
    this.updateWalletStore(this.record);
    this.emitter.emit('permissionsUpdated');
  }

  async removePermission({
    context,
    params: { origin, address },
  }: WalletMethodParams<{ origin: string; address?: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.removePermission(this.record, { origin, address });
    this.updateWalletStore(this.record);
    this.emitter.emit('permissionsUpdated');
  }

  async emitConnectionEvent({
    context,
    params: { origin },
  }: WalletMethodParams<{ origin: string }>) {
    this.verifyInternalOrigin(context);
    emitter.emit('connectToSiteEvent', { origin });
  }

  allowedOrigin(
    context: Partial<ChannelContext> | undefined,
    address: string
  ): context is PartiallyRequired<ChannelContext, 'origin'> {
    if (!context || !context.origin) {
      throw new Error('This method requires context');
    }
    if (context.origin === INTERNAL_ORIGIN) {
      return true;
    }
    if (!this.record) {
      return false;
    }
    return Model.isAccountAvailable(this.record, {
      address,
      origin: context.origin,
    });
  }

  async isAccountAvailableToOrigin({
    params: { address, origin },
    context,
  }: WalletMethodParams<{ address: string; origin: string }>) {
    this.verifyInternalOrigin(context);
    return !this.record
      ? false
      : Model.isAccountAvailable(this.record, { address, origin });
  }

  async getOriginPermissions({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    return this.record.permissions;
  }

  async setCurrentAddress({
    params: { address },
    context,
  }: WalletMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.setCurrentAddress(this.record, { address });
    this.updateWalletStore(this.record);

    const { currentAddress } = this.record.walletManager;
    this.emitter.emit(
      'currentAddressChange',
      [currentAddress].filter(isTruthy)
    );
  }

  readCurrentAddress() {
    return this.record?.walletManager.currentAddress || null;
  }

  ensureCurrentAddress(): string {
    const currentAddress = this.readCurrentAddress();
    if (!currentAddress) {
      throw new Error('Wallet is not initialized');
    }
    return currentAddress;
  }

  private ensureRecord(
    record: WalletRecord | null
  ): asserts record is WalletRecord {
    if (!record) {
      throw new RecordNotFound();
    }
  }

  private verifyInternalOrigin(
    context: Partial<ChannelContext | PrivateChannelContext> | undefined
  ): asserts context is PartiallyRequired<
    ChannelContext | PrivateChannelContext,
    'origin'
  > {
    if (
      context?.origin !== INTERNAL_ORIGIN &&
      context?.origin !== INTERNAL_ORIGIN_SYMBOL
    ) {
      throw new OriginNotAllowed();
    }
  }

  private ensureStringOrigin(
    context: Partial<ChannelContext | PrivateChannelContext> | undefined
  ): asserts context is PartiallyRequired<ChannelContext, 'origin'> {
    this.verifyInternalOrigin(context);
    if (typeof context.origin !== 'string') {
      throw new Error('Origin must be a string');
    }
  }

  async getCurrentAddress({ context }: WalletMethodParams) {
    this.verifyInternalOrigin(context);
    return this.readCurrentAddress();
  }

  async uiGetWalletGroups({ context }: WalletMethodParams) {
    this.verifyInternalOrigin(context);
    const groups = this.record?.walletManager.groups;
    return groups ? maskWalletGroups(groups) : null;
  }

  async uiGetWalletGroup({
    params: { groupId },
    context,
  }: WalletMethodParams<{ groupId: string }>) {
    this.verifyInternalOrigin(context);
    const group = this.record?.walletManager.groups.find(
      (group) => group.id === groupId
    );
    return group ? maskWalletGroup(group) : null;
  }

  async removeWalletGroup({
    params: { groupId },
    context,
  }: WalletMethodParams<{ groupId: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = Model.removeWalletGroup(this.record, { groupId });
    this.updateWalletStore(this.record);
  }

  async renameWalletGroup({
    params: { groupId, name },
    context,
  }: WalletMethodParams<{ groupId: string; name: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = Model.renameWalletGroup(this.record, { groupId, name });
    this.updateWalletStore(this.record);
  }

  async renameAddress({
    params: { address, name },
    context,
  }: WalletMethodParams<{ address: string; name: string }>) {
    this.verifyInternalOrigin(context);
    if (!this.record) {
      throw new RecordNotFound();
    }
    this.record = Model.renameAddress(this.record, { address, name });
    this.updateWalletStore(this.record);
  }

  async removeAddress({
    params: { address },
    context,
  }: WalletMethodParams<{ address: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.removeAddress(this.record, { address });
    this.updateWalletStore(this.record);
  }

  async updateLastBackedUp({
    params: { groupId },
    context,
  }: WalletMethodParams<{ groupId: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);

    if (!groupId) {
      throw new Error('Must provide groupId');
    }
    this.record = Model.updateLastBackedUp(this.record, {
      groupId,
      timestamp: Date.now(),
    });
    this.updateWalletStore(this.record);
  }

  async getNoBackupCount({ context }: WalletMethodParams) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    return this.record.walletManager.groups
      .filter((group) => group.walletContainer.seedType === SeedType.mnemonic)
      .filter((group) => group.origin === WalletOrigin.extension)
      .filter((group) => group.lastBackedUp == null).length;
  }

  async setPreferences({
    context,
    params: { preferences },
  }: WalletMethodParams<{
    preferences: Partial<WalletRecord['publicPreferences']>;
  }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.setPreferences(this.record, { preferences });
    this.updateWalletStore(this.record);
  }

  async getPreferences({
    context,
  }: WalletMethodParams): Promise<ReturnType<typeof Model.getPreferences>> {
    this.verifyInternalOrigin(context);
    return Model.getPreferences(this.record);
  }

  async getGlobalPreferences({ context }: WalletMethodParams) {
    this.verifyInternalOrigin(context);
    await this.globalPreferences.ready();
    return this.globalPreferences.getPreferences();
  }

  async setGlobalPreferences({
    context,
    params: { preferences },
  }: WalletMethodParams<{ preferences: Partial<GlobalPreferencesState> }>) {
    this.verifyInternalOrigin(context);
    await this.globalPreferences.ready();
    return this.globalPreferences.setPreferences(preferences);
  }

  async getFeedInfo({
    context,
  }: WalletMethodParams): Promise<ReturnType<typeof Model.getFeedInfo>> {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    return Model.getFeedInfo(this.record);
  }

  async markAbility({
    context,
    params: { ability, action },
  }: WalletMethodParams<{
    ability: WalletAbility;
    action: 'dismiss' | 'complete';
  }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.markAbility(this.record, { ability, action });
    this.updateWalletStore(this.record);
    emitter.emit('daylightAction', {
      event_name:
        action === 'complete'
          ? 'Perks: Complete Tab Clicked'
          : 'Perks: Dismiss Tab Clicked',
      ability_id: ability.uid,
      perk_type: ability.type,
    });
  }

  async unmarkAbility({
    context,
    params: { abilityId },
  }: WalletMethodParams<{
    abilityId: string;
  }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.record = Model.unmarkAbility(this.record, { abilityId });
    this.updateWalletStore(this.record);
    emitter.emit('daylightAction', {
      event_name: 'Perks: Reopen Tab Clicked',
      ability_id: abilityId,
    });
  }

  async userCanCreateInitialWallet({ context }: WalletMethodParams) {
    this.verifyInternalOrigin(context);
    return getRemoteConfigValue('user_can_create_initial_wallet');
  }

  async wallet_setWalletNameFlag({
    context,
    params: { flag, checked },
  }: WalletMethodParams<{ flag: WalletNameFlag; checked: boolean }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    if (checked) {
      this.record = Model.setWalletNameFlag(this.record, { flag });
    } else {
      this.record = Model.removeWalletNameFlag(this.record, { flag });
    }
    this.updateWalletStore(this.record);
  }

  async isFlaggedAsDapp({
    context,
    params: { origin },
  }: WalletMethodParams<{ origin: string }>) {
    this.verifyInternalOrigin(context);
    return isFlaggedAsDapp({ origin });
  }

  async switchChainForOrigin({
    params: { chain, origin },
    context,
  }: WalletMethodParams<{ chain: string; origin: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    this.setChainForOrigin(createChain(chain), origin);
  }

  /** @deprecated */
  getChainId() {
    throw new Error(
      'Wallet.getChainId is deprecated. Use Wallet.getChainIdForOrigin'
    );
  }

  /** @deprecated */
  async requestChainId({ context: _context }: PublicMethodParams) {
    throw new Error('requestChainId is deprecated');
  }

  async getChainIdForOrigin({ origin }: { origin: string }) {
    if (!this.record) {
      return '0x1';
    }
    const chain = Model.getChainForOrigin(this.record, { origin });
    const networks = await networksStore.load();
    return networks.getChainId(chain);
  }

  async requestChainForOrigin({
    params: { origin },
    context,
  }: WalletMethodParams<{ origin: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    const chain = Model.getChainForOrigin(this.record, { origin });
    return chain.toString();
  }

  /** @deprecated */
  setChainId(_chainId: string) {
    throw new Error('setChainId is deprecated. Use setChainForOrigin instead');
  }

  setChainForOrigin(chain: Chain, origin: string) {
    this.ensureRecord(this.record);
    this.record = Model.setChainForOrigin(this.record, { chain, origin });
    this.updateWalletStore(this.record);
    this.emitter.emit('chainChanged', chain, origin);
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
      ? Model.getWalletByAddress(this.record, currentAddress)
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
    {
      context,
      initiator,
      feeValueCommon,
    }: {
      context: Partial<ChannelContext> | undefined;
      initiator: string;
      feeValueCommon: string | null;
    }
  ): Promise<ethers.providers.TransactionResponse> {
    this.verifyInternalOrigin(context);
    if (!incomingTransaction.from) {
      throw new Error(
        '"from" field is missing from the transaction object. Send from current address?'
      );
    }
    const currentAddress = this.ensureCurrentAddress();
    if (
      normalizeAddress(incomingTransaction.from) !==
      normalizeAddress(currentAddress)
    ) {
      throw new Error(
        // TODO?...
        'transaction "from" field is different from currently selected address'
      );
    }
    const chainId = await this.getChainIdForOrigin({
      origin: new URL(initiator).origin,
    });
    const targetChainId = getTransactionChainId(incomingTransaction);
    if (targetChainId && chainId !== targetChainId) {
      throw new Error(
        'chainId in transaction object is different from current chainId'
      );
      // await this.wallet_switchEthereumChain({
      //   params: [{ chainId: targetChainId }],
      //   context,
      // });
      // return this.sendTransaction(incomingTransaction, context);
    } else if (targetChainId == null) {
      // eslint-disable-next-line no-console
      console.warn('chainId field is missing from transaction object');
      incomingTransaction.chainId = chainId;
    }
    const networks = await networksStore.load();
    const transaction = prepareTransaction(incomingTransaction);
    if (!hasGasPrice(transaction)) {
      await fetchAndAssignGasPrice(transaction, networks);
    }

    const signer = await this.getSigner(chainId);
    const transactionResponse = await signer.sendTransaction({
      ...transaction,
      type: transaction.type || undefined,
    });
    const safeTx = removeSignature(transactionResponse);
    emitter.emit('transactionSent', {
      transaction: safeTx,
      initiator,
      feeValueCommon,
    });
    return safeTx;
  }

  async signAndSendTransaction({
    params,
    context,
  }: WalletMethodParams<
    [IncomingTransaction, { initiator: string; feeValueCommon: string | null }]
  >) {
    this.verifyInternalOrigin(context);
    this.ensureStringOrigin(context);
    const [transaction, { initiator, feeValueCommon }] = params;
    if (!transaction) {
      throw new InvalidParams();
    }
    return this.sendTransaction(transaction, {
      context,
      initiator,
      feeValueCommon,
    });
  }

  async signTypedData_v4({
    params: { typedData: rawTypedData, initiator },
    context,
  }: WalletMethodParams<{ typedData: TypedData | string; initiator: string }>) {
    this.verifyInternalOrigin(context);
    if (!rawTypedData) {
      throw new InvalidParams();
    }
    const { chainId } = this.store.getState();
    const signer = await this.getSigner(chainId);
    const typedData = prepareTypedData(rawTypedData);

    // we remove unused types to avoid ethers error
    // based on https://github.com/ethers-io/ethers.js/blob/main/src.ts/hash/typed-data.ts#L210
    const parents = new Map<string, string[]>(
      Object.keys(typedData.types).map((key) => [key, []])
    );
    for (const name in typedData.types) {
      for (const field of typedData.types[name]) {
        const baseType = field.type.match(/^([^\x5b]*)(\x5b|$)/)?.[1] || null;
        if (baseType) {
          parents.get(baseType)?.push(name);
        }
      }
    }
    const unusedTypes = Array.from(parents.keys()).filter(
      (type) =>
        parents.get(type)?.length === 0 && type !== typedData.primaryType
    );
    const filteredTypes = omit(typedData.types, unusedTypes);

    const signature = await signer._signTypedData(
      typedData.domain,
      filteredTypes,
      typedData.message
    );
    emitter.emit('typedDataSigned', {
      typedData,
      initiator,
      address: signer.address,
    });
    return signature;
  }

  async personalSign({
    params: {
      params: [message],
      initiator,
    },
    context,
  }: WalletMethodParams<{
    params: [string, string?, string?];
    initiator: string;
  }>) {
    this.verifyInternalOrigin(context);
    if (message == null) {
      throw new InvalidParams();
    }
    const { chainId } = this.store.getState();
    const signer = await this.getSigner(chainId);
    const messageAsUtf8String = toUtf8String(message);
    const signature = await signer.signMessage(messageAsUtf8String);
    emitter.emit('messageSigned', {
      message: messageAsUtf8String,
      initiator,
      address: signer.address,
    });
    return signature;
  }

  async addEthereumChain({
    context,
    params: { values, origin },
  }: WalletMethodParams<{
    values: [NetworkConfig];
    origin: string;
  }>) {
    this.verifyInternalOrigin(context);
    const result = chainConfigStore.addEthereumChain(values[0], {
      origin,
    });

    this.emitter.emit('chainChanged', createChain(values[0].chain), origin);
    emitter.emit('addEthereumChain', {
      values: [result.value],
      origin: result.origin,
    });
    return result;
  }

  async removeEthereumChain({
    context,
    params: { chain: chainStr },
  }: WalletMethodParams<{ chain: string }>) {
    this.verifyInternalOrigin(context);
    this.ensureRecord(this.record);
    const chain = createChain(chainStr);
    chainConfigStore.removeEthereumChain(chain);
    // We need to update all permissions which point to the removed chain
    const affectedPermissions = Model.getPermissionsByChain(this.record, {
      chain,
    });
    affectedPermissions.forEach(({ origin }) => {
      this.setChainForOrigin(createChain(NetworkId.Ethereum), origin);
    });
    this.verifyOverviewChain();
  }

  private async verifyOverviewChain() {
    const networks = await networksStore.load();
    if (this.record) {
      this.record = Model.verifyOverviewChain(this.record, {
        availableChains: networks
          .getAllNetworks()
          .map((n) => createChain(n.chain)),
      });
      this.updateWalletStore(this.record);
    }
  }

  async getEthereumChainSources({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    return networksStore
      .load()
      .then(() => networksStore.getState().networks?.ethereumChainSources);
  }

  async getPendingTransactions({ context }: PublicMethodParams) {
    this.verifyInternalOrigin(context);
    return this.record?.transactions || [];
  }

  async screenView({ context, params }: WalletMethodParams<ScreenViewParams>) {
    // NOTE: maybe consider adding a more generic method, e.g.:
    // walletPort.request('sendEvent', { event_name, params }).
    this.verifyInternalOrigin(context);
    emitter.emit('screenView', params);
  }

  async daylightAction({
    context,
    params,
  }: WalletMethodParams<DaylightEventParams>) {
    this.verifyInternalOrigin(context);
    emitter.emit('daylightAction', params);
  }
}

interface Web3WalletPermission {
  /**
   * This seems to be a method that didn't get much adoption, but
   * metamask and some dapps use it for some reason:
   * https://eips.ethereum.org/EIPS/eip-2255
   */
  // The name of the method corresponding to the permission
  parentCapability: string;

  // The date the permission was granted, in UNIX epoch time
  date?: number;
}

class PublicController {
  wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  async eth_accounts({ context }: PublicMethodParams) {
    const currentAddress = this.wallet.readCurrentAddress();
    if (!currentAddress) {
      return [];
    }
    if (this.wallet.allowedOrigin(context, currentAddress)) {
      return [currentAddress];
    } else {
      return [];
    }
  }

  async eth_requestAccounts({ context }: PublicMethodParams) {
    const currentAddress = this.wallet.readCurrentAddress();
    if (currentAddress && this.wallet.allowedOrigin(context, currentAddress)) {
      const { origin } = context;
      emitter.emit('dappConnection', { origin, address: currentAddress });
      // Some dapps expect lowercase to be returned, otherwise they crash the moment after connection
      return [currentAddress.toLowerCase()];
    }
    if (!context?.origin) {
      throw new Error('This method requires origin');
    }
    const { origin } = context;
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/requestAccounts',
        search: `?origin=${origin}`,
        onResolve: async ({ address }: { address: string }) => {
          if (!address) {
            throw new Error('Confirmation resolved with invalid arguments');
          }
          const currentAddress = this.wallet.ensureCurrentAddress();
          if (normalizeAddress(address) !== normalizeAddress(currentAddress)) {
            await this.wallet.setCurrentAddress({
              params: { address },
              context: INTERNAL_SYMBOL_CONTEXT,
            });
          }
          this.wallet.acceptOrigin({
            params: { origin, address },
            context: INTERNAL_SYMBOL_CONTEXT,
          });
          const accounts = await this.eth_accounts({ context });
          emitter.emit('dappConnection', { origin, address });
          resolve(accounts.map((item) => item.toLowerCase()));
        },
        onDismiss: () => {
          reject(new UserRejected('User Rejected the Request'));
        },
      });
    });
  }

  async eth_chainId({ context }: PublicMethodParams): Promise<string> {
    /**
     * This is an interesting case. We do not check if context.origin is allowed
     * for current address and simply return saved chainId for this origin.
     * This seems to be okay because if the origin has no permissions at all, we will
     * default to ethereum anyway, but if the origin has permissions for an address which
     * is not current, it doesn't look like a problem to keep returning saved chainId
     * for this origin. In case the saved chainId is other than ethereum,
     * the dAPP will be able to make a conclusion that some _other_ address has some permissions,
     * but so what?
     */
    if (!context || !context.origin) {
      throw new Error('Unknown sender origin');
    }
    return this.wallet.getChainIdForOrigin({ origin: context.origin });
  }

  async net_version({ context }: PublicMethodParams) {
    const chainId = await this.eth_chainId({ context });
    return String(parseInt(chainId));
  }

  async eth_sendTransaction({
    params,
    context,
  }: PublicMethodParams<UnsignedTransaction[]>) {
    const currentAddress = this.wallet.ensureCurrentAddress();
    // TODO: should we check transaction.from instead of currentAddress?
    if (!this.wallet.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    const transaction = params[0];
    if (!transaction) {
      throw new InvalidParams();
    }
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/sendTransaction',
        search: `?${new URLSearchParams({
          origin: context.origin,
          transaction: JSON.stringify(transaction),
        })}`,
        onResolve: (hash) => {
          resolve(hash);
        },
        onDismiss: () => {
          reject(new UserRejectedTxSignature());
        },
      });
    });
  }

  async eth_signTypedData_v4({
    context,
    params: [address, data],
  }: PublicMethodParams<[string, TypedData | string]>) {
    const currentAddress = this.wallet.ensureCurrentAddress();
    if (!this.wallet.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    if (normalizeAddress(address) !== normalizeAddress(currentAddress)) {
      throw new Error(
        // TODO?...
        `Address parameter is different from currently selected address. Expected: ${currentAddress}, received: ${address}`
      );
    }
    const stringifiedData =
      typeof data === 'string' ? data : JSON.stringify(data);
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/signMessage',
        search: `?${new URLSearchParams({
          origin: context.origin,
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

  async personal_sign({
    params,
    context,
  }: PublicMethodParams<[string, string, string]>) {
    if (!params.length) {
      throw new InvalidParams();
    }
    const [shouldBeMessage, shouldBeAddress, _password] = params;
    const currentAddress = this.wallet.ensureCurrentAddress();

    let address = '';
    let message = '';
    if (isEthereumAddress(shouldBeAddress)) {
      address = shouldBeAddress;
      message = shouldBeMessage;
    } else if (isEthereumAddress(shouldBeMessage)) {
      // specification obliges us to send [message, address] params in this particular order
      // https://web3js.readthedocs.io/en/v1.2.11/web3-eth-personal.html#id15
      // but some dapps send personal_sign params in wrong order
      address = shouldBeMessage;
      message = shouldBeAddress;
    } else {
      throw new Error(
        `Address is required for "personal_sign" method. Expected: ${currentAddress}, received [${message}, ${address}]`
      );
    }

    if (
      address &&
      normalizeAddress(address) !== normalizeAddress(currentAddress)
    ) {
      throw new Error(
        // TODO?...
        `Address parameter is different from currently selected address. Expected: ${currentAddress}, received: ${address}`
      );
    }
    if (!this.wallet.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }

    const route = isSiweLike(message) ? '/siwe' : '/signMessage';

    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route,
        search: `?${new URLSearchParams({
          method: 'personal_sign',
          origin: context.origin,
          message,
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

  async wallet_switchEthereumChain({
    params,
    context,
  }: PublicMethodParams<[{ chainId: string | number }]>): Promise<
    null | object
  > {
    const currentAddress = this.wallet.readCurrentAddress();
    if (!currentAddress) {
      throw new Error('Wallet is not initialized');
    }
    if (!this.wallet.allowedOrigin(context, currentAddress)) {
      throw new OriginNotAllowed();
    }
    const { origin } = context;
    const { chainId: chainIdParameter } = params[0];
    const chainId = ethers.utils.hexValue(chainIdParameter);
    const currentChainIdForThisOrigin = await this.wallet.getChainIdForOrigin({
      origin,
    });
    if (chainId === currentChainIdForThisOrigin) {
      return null;
    }
    const networks = await networksStore.load();
    // TODO: handle unsupported chain id?
    const chain = networks.getChainById(chainId);
    // Switch immediately and return success
    this.wallet.setChainForOrigin(chain, origin);
    return null;
    // return new Promise((resolve, reject) => {
    //   notificationWindow.open({
    //     route: '/switchEthereumChain',
    //     search: `?origin=${origin}&chainId=${chainId}`,
    //     onResolve: () => {
    //       this.wallet.setChainId(chainId);
    //       resolve(null);
    //       this.wallet.emitter.emit('chainChanged', chainId);
    //     },
    //     onDismiss: () => {
    //       reject(new UserRejected('User Rejected the Request'));
    //     },
    //   });
    // });
  }

  async wallet_getWalletNameFlags({ context: _context }: PublicMethodParams) {
    const preferences = await this.wallet.getPreferences({
      /**
       * NOTE: we're not checking `context` param here and use
       * INTERNAL_SYMBOL_CONTEXT, because preferences.walletNameFlags are
       * supposed to work even before the user has given permissions
       * to the DApp. `walletNameFlags` are about global ethereum object behavior
       * and do not contain any private data
       */
      context: INTERNAL_SYMBOL_CONTEXT,
    });
    return preferences.walletNameFlags || [];
  }

  async wallet_getGlobalPreferences({ context: _context }: PublicMethodParams) {
    return this.wallet.getGlobalPreferences({
      /** wallet.getGlobalPreferences does not return any private data */
      context: INTERNAL_SYMBOL_CONTEXT,
    });
  }

  async wallet_flagAsDapp({
    context: _context,
    params: { origin },
  }: PublicMethodParams<{ origin: string }>) {
    await flagAsDapp({ origin });
  }

  private generatePermissionResponse(
    params: [{ [name: string]: unknown }]
  ): Web3WalletPermission[] {
    if (params?.[0] && 'eth_accounts' in params[0]) {
      return [{ parentCapability: 'eth_accounts' }];
    } else {
      throw new InvalidParams();
    }
  }

  private getIsAllowedOrigin({ context }: PublicMethodParams) {
    const currentAddress = this.wallet.readCurrentAddress();
    if (!currentAddress) {
      return false;
    }
    return this.wallet.allowedOrigin(context, currentAddress);
  }

  async wallet_requestPermissions({
    context,
    params,
  }: PublicMethodParams<[{ [name: string]: unknown }]>): Promise<
    Web3WalletPermission[]
  > {
    await this.eth_requestAccounts({ context });
    return this.generatePermissionResponse(params);
  }

  async wallet_getPermissions({
    context,
  }: PublicMethodParams): Promise<Web3WalletPermission[]> {
    if (this.getIsAllowedOrigin({ context })) {
      return [{ parentCapability: 'eth_accounts' }];
    } else {
      return [];
    }
  }

  async wallet_addEthereumChain({
    context,
    params,
  }: PublicMethodParams<[AddEthereumChainParameter]>) {
    if (!context?.origin) {
      throw new Error('This method requires origin');
    }
    const { origin } = context;
    return new Promise((resolve, reject) => {
      notificationWindow.open({
        route: '/addEthereumChain',
        search: `?${new URLSearchParams({
          origin,
          addEthereumChainParameter: JSON.stringify(params[0]),
        })}`,
        height: 700,
        onResolve: () => {
          resolve(null); // null indicates success as per spec
        },
        onDismiss: () => {
          reject(new UserRejected());
        },
      });
    });
  }

  async wallet_isKnownDapp({
    params: { origin },
  }: PublicMethodParams<{ origin: string }>) {
    // unlike wallet.isFlaggedAsDapp(), this method doesn't expose the list of
    // dapps the user might have visited and uses only an agnostic dapp list
    return isKnownDapp({ origin });
  }
}
