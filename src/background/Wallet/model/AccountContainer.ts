import type { ethers } from 'ethers';
import { immerable } from 'immer';
import { normalizeAddress } from 'src/shared/normalizeAddress';

/**
 * Externally Owned Account (EOA)
 * https://info.etherscan.com/understanding-ethereum-accounts/
 */
export interface ExternallyOwnedAccount {
  address: ethers.Wallet['address'];
  name: string | null;
}

export interface Device {
  /** Inspired by https://developer.mozilla.org/en-US/docs/Web/API/HIDDevice */
  productId: number;
  vendorId?: number;
  productName?: string;
}

export interface DeviceAccount extends ExternallyOwnedAccount {
  derivationPath: string;
}

type NonFunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

interface AccountContainerBase<T extends ExternallyOwnedAccount> {
  wallets: T[];
  provider: string | null; // null for "watched" addresses
  toPlainObject(): NonFunctionProperties<AccountContainerBase<T>>;
  getFirstWallet(): T;
  removeWallet(address: string): void;
  getWalletByAddress(address: string): T | null;
}

abstract class AbstractAccountContainer<T extends { address: string }> {
  abstract wallets: T[];

  toPlainObject() {
    // since methods aren't own properties, they will be skipped
    return { ...this };
  }

  getFirstWallet() {
    return this.wallets[0];
  }

  removeWallet(address: string) {
    const normalizedAddress = normalizeAddress(address);
    const pos = this.wallets.findIndex(
      (wallet) => normalizeAddress(wallet.address) === normalizedAddress
    );
    if (pos === -1) {
      return;
    }
    this.wallets.splice(pos, 1);
  }

  getWalletByAddress(address: string) {
    const normalizedAddress = normalizeAddress(address);
    const wallet = this.wallets.find(
      (wallet) => normalizeAddress(wallet.address) === normalizedAddress
    );
    return wallet || null;
  }
}

export class ReadonlyAccountContainer
  extends AbstractAccountContainer<ExternallyOwnedAccount>
  implements AccountContainerBase<ExternallyOwnedAccount>
{
  /**
   * Important to add [immerable] = true property if we want
   * to use immer to copy WalletContainers:
   * https://immerjs.github.io/immer/complex-objects
   * As of now, walletContainers are copied in the maskWalletGroup functions
   */
  [immerable] = true;

  wallets: ExternallyOwnedAccount[];
  provider = null;

  constructor(wallets: ExternallyOwnedAccount[]) {
    super();
    this.wallets = wallets;
  }
}

export class DeviceAccountContainer
  extends AbstractAccountContainer<DeviceAccount>
  implements AccountContainerBase<DeviceAccount>
{
  /**
   * Important to add [immerable] = true property if we want
   * to use immer to copy WalletContainers:
   * https://immerjs.github.io/immer/complex-objects
   * As of now, walletContainers are copied in the maskWalletGroup functions
   */
  [immerable] = true;

  device: Device;
  provider: string;
  wallets: DeviceAccount[];

  constructor({
    device,
    wallets,
    provider,
  }: {
    device: Device;
    wallets: DeviceAccount[];
    provider: string;
  }) {
    super();
    this.device = device;
    this.wallets = wallets;
    this.provider = provider;
  }
}

export type AccountContainer =
  | ReadonlyAccountContainer
  | DeviceAccountContainer;
