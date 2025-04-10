import type { EventsMap } from 'nanoevents';
import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';
import { createSalt, createCryptoKey } from 'src/modules/crypto';
import { getSHA256HexDigest } from 'src/modules/crypto/getSHA256HexDigest';
import {
  BrowserStorage,
  SessionStorage,
  clearStorageArtefacts,
} from 'src/background/webapis/storage';
import { validate } from 'src/shared/validation/user-input';
import { eraseAndUpdateToLatestVersion } from 'src/shared/core/version/shared';
import { currentUserKey } from 'src/shared/getCurrentUser';
import type { PublicUser, User } from 'src/shared/types/User';
import { payloadId } from '@walletconnect/jsonrpc-utils';
import { Wallet } from '../Wallet/Wallet';
import { peakSavedWalletState } from '../Wallet/persistence';
import type { NotificationWindow } from '../NotificationWindow/NotificationWindow';
import { globalPreferences } from '../Wallet/GlobalPreferences';
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

export class LoginActivity {
  static async recordLogin() {
    await BrowserStorage.set('loggedInAt', Date.now());
  }

  static async recordLogout() {
    await BrowserStorage.set('loggedInAt', null);
  }

  static async getState() {
    const loggedInAt = await BrowserStorage.get<number | null>('loggedInAt');
    return { loggedInAt };
  }
}

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
    await BrowserStorage.set(currentUserKey, user);
  }

  static async readCurrentUser() {
    return BrowserStorage.get<User>(currentUserKey);
  }

  private static async removeCurrentUser() {
    await BrowserStorage.remove(currentUserKey);
  }

  private static async writeCredentials(credentials: Credentials) {
    const preferences = await globalPreferences.getPreferences();
    if (preferences.autoLockTimeout === 'none') {
      await Promise.all([
        BrowserStorage.set(credentialsKey, credentials),
        SessionStorage.remove(credentialsKey), // make sure other storage doesn't have a duplicate
      ]);
    } else {
      await Promise.all([
        SessionStorage.set(credentialsKey, credentials),
        BrowserStorage.remove(credentialsKey), // make sure other storage doesn't have a duplicate
      ]);
    }
    await LoginActivity.recordLogin();
  }

  private static async readCredentials() {
    return (
      (await SessionStorage.get<Credentials>(credentialsKey)) ||
      (await BrowserStorage.get<Credentials>(credentialsKey))
    );
  }

  private static async removeCredentials() {
    await BrowserStorage.remove(credentialsKey);
    await SessionStorage.remove(credentialsKey);
    await LoginActivity.recordLogout();
    await clearStorageArtefacts();
  }

  /** Migrates credentials from storage.local to storage.session if needed */
  static async migrateCredentialsIfNeeded() {
    type AnyStorage = typeof BrowserStorage | typeof SessionStorage;
    async function move(params: { from: AnyStorage; to: AnyStorage }) {
      const credentials = await params.from.get<Credentials>(credentialsKey);
      if (credentials) {
        await params.to.set(credentialsKey, credentials);
        await params.from.remove(credentialsKey);
      }
    }
    const preferences = await globalPreferences.getPreferences();
    if (preferences.autoLockTimeout === 'none') {
      await move({ from: SessionStorage, to: BrowserStorage });
    } else {
      await move({ from: BrowserStorage, to: SessionStorage });
    }
  }

  static async ensureUserAndWallet() {
    const existingUser = await Account.readCurrentUser();
    const walletTable = await peakSavedWalletState();
    if (existingUser && !walletTable?.[existingUser.id]) {
      await Account.removeCurrentUser();
    }
  }

  static async createUser(password: string): User {
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
    globalPreferences.on('change', (prevState, newState) => {
      if (newState.autoLockTimeout !== prevState.autoLockTimeout) {
        Account.migrateCredentialsIfNeeded();
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

  isAuthenticated(): boolean {
    return this.getUser() != null;
  }

  /** Method to check that user exists, meaning onboarding has been completed */
  async hasExistingUser(): Promise<boolean> {
    const user = await Account.readCurrentUser();
    return Boolean(user);
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
    return this.account.isAuthenticated();
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
