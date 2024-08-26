import type { EventsMap } from 'nanoevents';
import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';
import { createSalt, createCryptoKey } from 'src/modules/crypto';
import { getSHA256HexDigest } from 'src/modules/crypto/getSHA256HexDigest';
import * as browserStorage from 'src/background/webapis/storage';
import { validate } from 'src/shared/validation/user-input';
import { eraseAndUpdateToLatestVersion } from 'src/shared/core/version';
import { currentUserKey } from 'src/shared/getCurrentUser';
import type { PublicUser, User } from 'src/shared/types/User';
import { payloadId } from '@walletconnect/jsonrpc-utils';
import { Wallet } from '../Wallet/Wallet';
import { peakSavedWalletState } from '../Wallet/persistence';
import type { NotificationWindow } from '../NotificationWindow/NotificationWindow';
import { credentialsKey } from './storage-keys';

const TEMPORARY_ID = 'temporary';

async function sha256({ password, salt }: { password: string; salt: string }) {
  return await getSHA256HexDigest(`${salt}:${password}`);
}

class EventEmitter<Events extends EventsMap> {
  private emitter = createNanoEvents<Events>();

  on<Event extends keyof Events>(event: Event, cb: Events[Event]) {
    return this.emitter.on(event, cb);
  }

  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>) {
    return this.emitter.emit(event, ...args);
  }
}

type AccountEvents = { reset: () => void; authenticated: () => void };

interface Credentials {
  encryptionKey: string;
}
export class Account extends EventEmitter<AccountEvents> {
  private user: User | null;
  private encryptionKey: string | null;
  private wallet: Wallet;
  private notificationWindow: NotificationWindow;

  isPendingNewUser: boolean;

  private static async writeCurrentUser(user: User) {
    await browserStorage.set(currentUserKey, user);
  }

  private static async writeCredentials(credentials: Credentials) {
    await browserStorage.set(credentialsKey, credentials);
  }

  private static async readCredentials() {
    return await browserStorage.get<Credentials>(credentialsKey);
  }

  private static async removeCredentials() {
    return await browserStorage.remove(credentialsKey);
  }

  static async readCurrentUser() {
    return browserStorage.get<User>(currentUserKey);
  }

  private static async removeCurrentUser() {
    await browserStorage.remove(currentUserKey);
  }

  static async ensureUserAndWallet() {
    const existingUser = await Account.readCurrentUser();
    const walletTable = await peakSavedWalletState();
    if (existingUser && !walletTable?.[existingUser.id]) {
      await Account.removeCurrentUser();
    }
  }

  static createUser(password: string): User {
    const validity = validate({ password });
    if (!validity.valid) {
      throw new Error(validity.message);
    }
    const id = nanoid(36); // use longer id than default (21)
    const salt = createSalt(); // used to encrypt seed phrases
    const record = { id, salt /* passwordHash: hash */ };
    return record;
  }

  constructor({
    notificationWindow,
  }: {
    notificationWindow: NotificationWindow;
  }) {
    super();
    this.user = null;
    this.isPendingNewUser = false;
    this.encryptionKey = null;
    this.notificationWindow = notificationWindow;
    this.wallet = new Wallet(TEMPORARY_ID, null, this.notificationWindow);
    this.on('authenticated', () => {
      if (this.encryptionKey) {
        Account.writeCredentials({ encryptionKey: this.encryptionKey });
      }
    });
  }

  async initialize() {
    // Try to automatically login if credentials are found in storage
    const credentials = await Account.readCredentials();
    const user = await Account.readCurrentUser();
    if (user && credentials) {
      const valid = await this.verifyCredentials(user, credentials);
      if (valid) {
        await this.setUser(user, credentials);
      }
    }
  }

  private reset() {
    this.user = null;
    this.encryptionKey = null;
    this.wallet.resetCredentials();
    this.wallet.destroy();
    this.wallet = new Wallet(TEMPORARY_ID, null, this.notificationWindow);
    this.emit('reset');
  }

  async verifyCredentials(user: User, { encryptionKey }: Credentials) {
    try {
      await this.wallet.verifyCredentials({
        params: { id: user.id, encryptionKey },
        id: payloadId(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyPassword(user: User, password: string) {
    const encryptionKey = await sha256({ password, salt: user.id });
    return this.verifyCredentials(user, { encryptionKey });
  }

  async login(user: User, password: string) {
    const passwordIsCorrect = await this.verifyPassword(user, password);
    if (!passwordIsCorrect) {
      throw new Error('Incorrect password');
    }
    await this.setUser(user, { password }, { isNewUser: false });
  }

  async setUser(
    user: User,
    credentials: { password: string } | { encryptionKey: string },
    { isNewUser = false } = {}
  ) {
    this.user = user;
    this.isPendingNewUser = isNewUser;
    let seedPhraseEncryptionKey: string | null = null;
    let seedPhraseEncryptionKey_deprecated: CryptoKey | null = null;
    if ('password' in credentials) {
      const { password } = credentials;
      const [key1, key2, key3] = await Promise.all([
        sha256({ salt: user.id, password }),
        sha256({ salt: user.salt, password }),
        createCryptoKey(password, user.salt),
      ]);
      this.encryptionKey = key1;
      seedPhraseEncryptionKey = key2;
      seedPhraseEncryptionKey_deprecated = key3;
    } else {
      this.encryptionKey = credentials.encryptionKey;
    }
    await this.wallet.updateCredentials({
      id: payloadId(),
      params: {
        credentials: {
          id: user.id,
          encryptionKey: this.encryptionKey,
          seedPhraseEncryptionKey,
          seedPhraseEncryptionKey_deprecated,
        },
        isNewUser,
      },
    });
    if (!this.isPendingNewUser) {
      this.emit('authenticated');
    }
  }

  getEncryptionKey() {
    return this.encryptionKey;
  }

  getUser() {
    return this.user;
  }

  getCurrentWallet() {
    return this.wallet;
  }

  hasActivePasswordSession(): boolean {
    return this.wallet.hasSeedPhraseEncryptionKey();
  }

  expirePasswordSession() {
    this.wallet.removeSeedPhraseEncryptionKey();
  }

  async saveUserAndWallet() {
    if (!this.user || !this.wallet || this.wallet.id === TEMPORARY_ID) {
      throw new Error('Cannot persist: invalid session state');
    }
    await Account.writeCurrentUser(this.user);
    await this.wallet.savePendingWallet();

    if (this.isPendingNewUser) {
      this.isPendingNewUser = false;
      this.emit('authenticated');
    }

    /**
     * Cleaning up:
     * Right now, only one "currentUser" can exist, so we remove
     * all other entries from walletStore because they become unreachable anyway.
     */
    const walletTable = await this.wallet.walletStore.getSavedState();
    if (this.user) {
      const { id } = this.user;
      this.wallet.walletStore.deleteMany(
        Object.keys(walletTable).filter((key) => key !== id)
      );
    }
  }

  async logout() {
    await Account.removeCredentials();
    return this.reset();
  }
}

Object.assign(globalThis, {
  getSHA256HexDigest,
  // account,
  Account,
});

export type PublicMethodParams<T = undefined> = T extends undefined
  ? never
  : { params: T };

export class AccountPublicRPC {
  private account: Account;

  constructor(account: Account) {
    this.account = account;
  }

  async isAuthenticated() {
    return this.account.getUser() != null;
  }

  async getExistingUser(): Promise<PublicUser | null> {
    const user = await Account.readCurrentUser();
    if (user) {
      return { id: user.id };
    }
    return null;
  }

  async login({
    params: { user, password },
  }: PublicMethodParams<{
    user: PublicUser;
    password: string;
  }>): Promise<PublicUser | null> {
    const currentUser = await Account.readCurrentUser();
    if (!currentUser || currentUser.id !== user.id) {
      throw new Error(`User ${user.id} not found`);
    }
    const canAuthorize = await this.account.verifyPassword(
      currentUser,
      password
    );
    if (canAuthorize) {
      await this.account.login(currentUser, password);
      return user;
    } else {
      throw new Error('Incorrect password');
    }
  }

  async hasActivePasswordSession() {
    return this.account.hasActivePasswordSession();
  }

  async createUser({
    params: { password },
  }: PublicMethodParams<{ password: string }>): Promise<PublicUser> {
    const user = await Account.createUser(password);
    await this.account.setUser(user, { password }, { isNewUser: true });
    return { id: user.id };
  }

  async saveUserAndWallet() {
    return this.account.saveUserAndWallet();
  }

  async isPendingNewUser() {
    return this.account.isPendingNewUser;
  }

  async logout() {
    return this.account.logout();
  }

  async eraseAllData() {
    await eraseAndUpdateToLatestVersion();
    await this.account.logout(); // reset account after erasing storage
  }
}
