import { ethers } from 'ethers';
import { immerable } from 'immer';
import { restoreBareWallet, walletToObject } from 'src/shared/wallet/create';
import { SeedType } from './SeedType';
import type { BareWallet } from './types';

interface PlainWalletContainer {
  seedType: SeedType;
  wallets: BareWallet[];
}

export interface WalletContainer {
  seedType: SeedType;
  wallets: BareWallet[];
  getMnemonic(): BareWallet['mnemonic'] | null;
  getFirstWallet(): BareWallet;
  addWallet(wallet: BareWallet): void;
  removeWallet(address: string): void;
  toPlainObject(): PlainWalletContainer;
  getWalletByAddress(address: string): BareWallet | null;
}

abstract class WalletContainerImpl implements WalletContainer {
  /**
   * Important to add [immerable] = true property if we want
   * to use immer to copy WalletContainers:
   * https://immerjs.github.io/immer/complex-objects
   * As of now, walletContainers are copied in the maskWalletGroup functions
   */
  [immerable] = true;

  abstract wallets: BareWallet[];
  abstract seedType: SeedType;

  getFirstWallet() {
    return this.wallets[0];
  }

  getMnemonic() {
    return this.seedType === SeedType.privateKey
      ? null
      : this.getFirstWallet().mnemonic;
  }

  addWallet(wallet: BareWallet) {
    const currentMnemonic = this.getMnemonic();
    if (currentMnemonic) {
      if (
        !wallet.mnemonic ||
        wallet.mnemonic.phrase !== currentMnemonic.phrase
      ) {
        throw new Error(
          'Added wallet must have the same mnemonic as other wallets in the WalletContainer'
        );
      }
    }
    if (this.wallets.some(({ address }) => address === wallet.address)) {
      /** Seems it's better to keep existing wallet in order to save existing state, e.g. name */
      return;
    }
    this.wallets.push(wallet);
  }

  removeWallet(address: string) {
    const pos = this.wallets.findIndex(
      (wallet) => wallet.address.toLowerCase() === address.toLowerCase()
    );
    if (pos === -1) {
      return;
    }
    this.wallets.splice(pos, 1);
  }

  getWalletByAddress(address: string) {
    const wallet = this.wallets.find(
      (wallet) => wallet.address.toLowerCase() === address.toLowerCase()
    );
    return wallet || null;
  }

  toPlainObject() {
    return {
      ...this,
      wallets: this.wallets.map((wallet) => walletToObject(wallet)),
    };
  }
}

export class MnemonicWalletContainer extends WalletContainerImpl {
  wallets: BareWallet[];
  seedType = SeedType.mnemonic;

  constructor(wallets?: Array<Pick<BareWallet, 'mnemonic'>>) {
    super();
    if (!wallets || !wallets.length) {
      this.wallets = [restoreBareWallet({})];
    } else {
      this.wallets = wallets.map((wallet) => {
        if (!wallet.mnemonic) {
          throw new Error(
            'Mnemonic container is expected to have a wallet with a mnemonic'
          );
        }
        return restoreBareWallet(wallet);
      });
    }
  }
}

export class PrivateKeyWalletContainer extends WalletContainerImpl {
  wallets: BareWallet[];
  seedType = SeedType.privateKey;

  constructor(wallets: Array<Pick<BareWallet, 'privateKey'>>) {
    super();
    if (!wallets || wallets.length > 1) {
      throw new Error(
        `Wallets array is expected to have exactly one element, instead got: ${wallets?.length}`
      );
    }
    this.wallets = wallets.map((wallet) => {
      if (!wallet.privateKey) {
        throw new Error(
          'PrivateKey container is expected to have a wallet with a privateKey'
        );
      }
      return restoreBareWallet(new ethers.Wallet(wallet.privateKey));
    });
  }

  addWallet(_wallet: BareWallet) {
    throw new Error('PrivateKeyWalletContainer cannot have multiple wallets');
  }
}

export class TestPrivateKeyWalletContainer extends WalletContainerImpl {
  wallets: BareWallet[];
  seedType = SeedType.privateKey;

  constructor(wallets: BareWallet[]) {
    super();
    this.wallets = wallets;
  }
}
