import { nanoid } from 'nanoid';
import EventEmitter from 'events';
import { generateSalt } from '@metamask/browser-passworder';
import { get, remove, set } from 'src/background/webapis/storage';
import { getSHA256HexDigest } from 'src/shared/cryptography/getSHA256HexDigest';
import { Wallet } from '../Wallet/Wallet';
import { walletStore } from '../Wallet/persistence';
import { validate } from 'src/shared/validation/user-input';

interface User {
  id: string;
  passwordHash: string;
  salt: string;
}

export interface PublicUser {
  id: User['id'];
}

const TEMPORARY_ID = 'temporary';

export class Account extends EventEmitter {
  private user: User | null;
  private encryptionKey: string | null;
  private wallet: Wallet;

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
    const id = nanoid();
    const salt = generateSalt();
    const hash = await getSHA256HexDigest(`${salt}:${password}`);
    const record = { id, passwordHash: hash, salt };
    // await set('currentUser', record);
    return record;
  }

  static async verifyPassword(user: User, password: string) {
    const { salt } = user;
    const hash = await getSHA256HexDigest(`${salt}:${password}`);
    return hash === user.passwordHash;
  }

  constructor() {
    super();
    this.user = null;
    this.encryptionKey = null;
    this.wallet = new Wallet(TEMPORARY_ID, null);
  }

  reset() {
    this.user = null;
    this.encryptionKey = null;
    this.wallet = new Wallet(TEMPORARY_ID, null);
    this.emit('reset');
  }

  async init(user: User, password: string) {
    const passwordIsCorrect = await Account.verifyPassword(user, password);
    if (!passwordIsCorrect) {
      throw new Error('Incorrect password');
    }
    this.user = user;
    const salt = user.id;
    this.encryptionKey = await getSHA256HexDigest(`${salt}:${password}`);
    await this.wallet.updateCredentials({
      params: { id: user.id, encryptionKey: this.encryptionKey },
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

  async saveUserAndWallet() {
    if (!this.user || !this.wallet || this.wallet.id === TEMPORARY_ID) {
      throw new Error('Cannot persist: invalid session state');
    }
    await Account.writeCurrentUser(this.user);
    await this.wallet.savePendingWallet();

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
    const canAuthorize = await Account.verifyPassword(currentUser, password);
    if (canAuthorize) {
      await this.account.init(currentUser, password);
      return user;
    } else {
      throw new Error('Incorrect password');
    }
  }

  async verify({
    params: { user, password },
  }: PublicMethodParams<{
    user: PublicUser;
    password: string;
  }>): Promise<boolean> {
    const currentUser = await Account.readCurrentUser();
    if (!currentUser || currentUser.id !== user.id) {
      throw new Error(`User ${user.id} not found`);
    }
    const canAuthorize = await Account.verifyPassword(currentUser, password);
    if (canAuthorize) {
      return true;
    } else {
      throw new Error('Incorrect password');
    }
  }

  async createUser({
    params: { password },
  }: PublicMethodParams<{ password: string }>): Promise<PublicUser> {
    const user = await Account.createUser(password);
    await this.account.init(user, password);
    return { id: user.id };
  }

  async saveUserAndWallet() {
    return this.account.saveUserAndWallet();
  }

  async logout() {
    return this.account.logout();
  }
}
