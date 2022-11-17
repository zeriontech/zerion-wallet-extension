import EventEmitter from 'events';
import { nanoid } from 'nanoid';
import { createSalt, createCryptoKey } from 'src/modules/crypto';
import { getSHA256HexDigest } from 'src/modules/crypto/getSHA256HexDigest';
import { get, remove, set } from 'src/background/webapis/storage';
import { validate } from 'src/shared/validation/user-input';
import { Wallet } from '../Wallet/Wallet';
import { walletStore } from '../Wallet/persistence';

interface User {
  id: string;
  salt: string;
}

export interface PublicUser {
  id: User['id'];
}

const TEMPORARY_ID = 'temporary';

async function createEncryptionKey({
  password,
  salt,
}: {
  password: string;
  salt: string;
}) {
  return await getSHA256HexDigest(`${salt}:${password}`);
}

export class Account extends EventEmitter {
  private user: User | null;
  private encryptionKey: string | null;
  private wallet: Wallet;

  isPendingNewUser: boolean;

  private static async writeCurrentUser(user: User) {
    await set('currentUser', user);
  }

  static async readCurrentUser() {
    return get<User>('currentUser');
  }

  private static async removeCurrentUser() {
    await remove('currentUser');
  }

  static async ensureUserAndWallet() {
    const existingUser = await Account.readCurrentUser();
    const walletTable = await walletStore.getSavedState();
    if (existingUser && !walletTable?.[existingUser.id]) {
      await Account.removeCurrentUser();
    }
  }

  static async createUser(password: string): Promise<User> {
    const validity = validate({ password });
    if (!validity.valid) {
      throw new Error(validity.message);
    }
    const id = nanoid(36); // use longer id than default (21)
    const salt = createSalt(); // used to encrypt seed phrases
    const record = { id, salt /* passwordHash: hash */ };
    return record;
  }

  constructor() {
    super();
    this.user = null;
    this.isPendingNewUser = false;
    this.encryptionKey = null;
    this.wallet = new Wallet(TEMPORARY_ID, null);
  }

  reset() {
    this.user = null;
    this.encryptionKey = null;
    this.wallet = new Wallet(TEMPORARY_ID, null);
    this.emit('reset');
  }

  async verifyPassword(user: User, password: string) {
    const encryptionKey = await createEncryptionKey({
      password,
      salt: user.id,
    });
    try {
      await this.wallet.verifyCredentials({
        params: { id: user.id, encryptionKey },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async login(user: User, password: string) {
    const passwordIsCorrect = await this.verifyPassword(user, password);
    if (!passwordIsCorrect) {
      throw new Error('Incorrect password');
    }
    await this.setUser(user, password, { isNewUser: false });
  }

  async setUser(user: User, password: string, { isNewUser = false } = {}) {
    this.user = user;
    this.isPendingNewUser = isNewUser;
    this.encryptionKey = await createEncryptionKey({ salt: user.id, password });
    const seedPhraseEncryptionKey = await createCryptoKey(password, user.salt);
    await this.wallet.updateCredentials({
      params: {
        id: user.id,
        encryptionKey: this.encryptionKey,
        seedPhraseEncryptionKey,
      },
    });
    this.emit('authenticated');
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
    this.isPendingNewUser = false;

    /**
     * Cleaning up:
     * Right now, only one "currentUser" can exist, so we remove
     * all other entries from walletStore because they become unreachable anyway.
     */
    const walletTable = await walletStore.getSavedState();
    if (this.user) {
      const { id } = this.user;
      walletStore.deleteMany(
        Object.keys(walletTable).filter((key) => key !== id)
      );
    }
  }

  logout() {
    return this.reset();
  }
}

Object.assign(window, {
  getSHA256HexDigest,
  // account,
  Account,
});

type PublicMethodParams<T = undefined> = T extends undefined
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
    await this.account.setUser(user, password, { isNewUser: true });
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
}
