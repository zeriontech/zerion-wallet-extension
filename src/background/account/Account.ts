import { nanoid } from 'nanoid';
import EventEmitter from 'events';
import { generateSalt } from '@metamask/browser-passworder';
import { get, set } from 'src/background/webapis/storage';
import { getSHA256HexDigest } from 'src/shared/crypto/getSHA256HexDigest';

interface User {
  id: string;
  passwordHash: string;
  salt: string;
}

export interface PublicUser {
  id: User['id'];
}

class Users {
  async create(id: string, password: string) {
    const salt = generateSalt();
    const hash = await getSHA256HexDigest(`${salt}:${password}`);
    const record = { id, passwordHash: hash, salt };
    await set('currentUser', record);
    return record;
  }

  async getUser() {
    return get<User>('currentUser');
  }

  static async verifyPassword(user: User, password: string) {
    const { salt } = user;
    const hash = await getSHA256HexDigest(`${salt}:${password}`);
    return hash === user.passwordHash;
  }
}

const users = new Users();

export class Account extends EventEmitter {
  // private password: null | string;
  private user: User | null;
  private passwordHashed: string | null;

  static async create(password: string) {
    return users.create(nanoid(), password);
  }

  static async getUser() {
    return users.getUser();
  }

  static async verifyPassword(user: User, password: string) {
    return Users.verifyPassword(user, password);
  }

  constructor() {
    super();
    this.user = null;
    this.passwordHashed = null;
  }

  async init(user: User, password: string) {
    const passwordIsCorrect = await Account.verifyPassword(user, password);
    if (!passwordIsCorrect) {
      throw new Error('Incorrect password');
    }
    this.user = user;
    const salt = user.id;
    this.passwordHashed = await getSHA256HexDigest(`${salt}:${password}`);
    this.emit('authorized');
  }

  getEncryptionKey() {
    return this.passwordHashed;
  }

  getUser() {
    return this.user;
  }
}

Object.assign(window, {
  getSHA256HexDigest,
  users,
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
    const user = await Account.getUser();
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
    const currentUser = await Account.getUser();
    if (!currentUser || currentUser.id !== user.id) {
      throw new Error('User not found');
    }
    const canAuthorize = await Account.verifyPassword(currentUser, password);
    if (canAuthorize) {
      await this.account.init(currentUser, password);
      return user;
    } else {
      throw new Error('Incorrect password');
    }
  }

  async createUser({
    params: { password },
  }: PublicMethodParams<{ password: string }>): Promise<PublicUser> {
    const user = await Account.create(password);
    await this.account.init(user, password);
    return { id: user.id };
  }

  // async create({
  //   params: { password },
  // }: PublicMethodParams<{ password: string }>) {
  //   return Account.create(password);
  // }
  //
  // async getUser() {
  //   return Account.getUser();
  // }
  //
  // async verifyPassword({
  //   params: { user, password },
  // }: PublicMethodParams<{ user: User; password: string }>) {
  //   return Users.verifyPassword(user, password);
  // }

  // init({
  //   params: { user, password },
  // }: PublicMethodParams<{ user: User; password: string }>) {
  //   return
  //   const passwordIsCorrect = await Account.verifyPassword(user, password);
  //   if (!passwordIsCorrect) {
  //     throw new Error('Incorrect password');
  //   }
  //   // this.user = user;
  //   const salt = user.id;
  //   this.passwordHashed = await getSHA256HexDigest(`${salt}:${password}`);
  // }
}
