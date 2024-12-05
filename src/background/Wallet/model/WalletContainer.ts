import { immerable } from 'immer';
import type {
  Credentials,
  SessionCredentials,
} from 'src/background/account/Credentials';
import { isSessionCredentials } from 'src/background/account/Credentials';
import { encrypt } from 'src/modules/crypto';
import { invariant } from 'src/shared/invariant';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { restoreBareWallet, walletToObject } from 'src/shared/wallet/create';
import {
  decryptMnemonic,
  seedPhraseToHash,
} from 'src/shared/wallet/encryption';
import { SeedType } from './SeedType';
import type { BareWallet } from './BareWallet';

interface PlainWalletContainer {
  seedType: SeedType;
  wallets: BareWallet[];
}

export interface SignerContainer {
  /**
   * Contains data necessary for signing, e.g. private key or a seed phrase
   */
  seedType: SeedType;
  seedHash?: string;
  wallets: BareWallet[];
  getMnemonic(): BareWallet['mnemonic'] | null;
  getFirstWallet(): BareWallet;
  addWallet(wallet: BareWallet, seedHash: string): void;
  removeWallet(address: string): void;
  toPlainObject(): PlainWalletContainer;
  getWalletByAddress(address: string): BareWallet | null;
}

abstract class WalletContainerImpl implements SignerContainer {
  /**
   * Important to add [immerable] = true property if we want
   * to use immer to copy WalletContainers:
   * https://immerjs.github.io/immer/complex-objects
   * As of now, walletContainers are copied in the maskWalletGroup functions
   */
  [immerable] = true;

  abstract wallets: BareWallet[];
  abstract seedType: SeedType;
  abstract seedHash?: string;

  getFirstWallet() {
    return this.wallets[0];
  }

  getMnemonic() {
    return this.seedType === SeedType.privateKey
      ? null
      : this.getFirstWallet().mnemonic;
  }

  abstract addWallet(wallet: BareWallet, seedHash: string): void;

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
      (wallet) => normalizeAddress(wallet.address) === normalizeAddress(address)
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

const MISSING_MNEMONIC =
  'Mnemonic Container is expected to have a wallet with a mnemonic';

type BareMnemonicWallet = PartiallyRequired<BareWallet, 'mnemonic'>;

function isMnemonicBareWallet(
  x: BareWallet | BareMnemonicWallet
): x is BareMnemonicWallet {
  return Boolean(x.mnemonic?.path && x.mnemonic.phrase);
}

function assertMnemonicWallets(
  x: BareWallet[] | BareMnemonicWallet[] | (BareMnemonicWallet | BareWallet)[]
): asserts x is BareMnemonicWallet[] {
  if (x.some((w) => !isMnemonicBareWallet(w))) {
    throw new Error('Only mnemonic wallets are expected');
  }
}

export class MnemonicWalletContainer extends WalletContainerImpl {
  wallets: BareWallet[];
  seedType = SeedType.mnemonic;
  seedHash: string | undefined;

  static async create({
    wallets,
    credentials,
  }: {
    wallets?: BareMnemonicWallet[];
    credentials: SessionCredentials;
  }): Promise<MnemonicWalletContainer> {
    const initial = wallets?.length
      ? wallets
      : [restoreBareWallet({}) as BareMnemonicWallet];
    const phrase = initial[0].mnemonic?.phrase;
    invariant(phrase, MISSING_MNEMONIC);
    const seedHash = await seedPhraseToHash(phrase);
    const walletContainer = new MnemonicWalletContainer(initial, seedHash);
    const { mnemonic } = walletContainer.getFirstWallet();
    if (mnemonic) {
      const encryptedMnemonic = await encrypt(
        credentials.seedPhraseEncryptionKey,
        mnemonic.phrase
      );
      walletContainer.wallets.forEach((wallet) => {
        if (wallet.mnemonic) {
          wallet.mnemonic.phrase = encryptedMnemonic;
        }
      });
    }
    return walletContainer;
  }

  private static async restoreFromDeprecated({
    wallets,
    credentials,
  }: {
    wallets: BareMnemonicWallet[];
    credentials: SessionCredentials;
  }) {
    if (!wallets.length) {
      return MnemonicWalletContainer.create({ wallets, credentials });
    } else {
      const phrase = wallets[0].mnemonic?.phrase;
      invariant(phrase, MISSING_MNEMONIC);
      const decryptedPhrase = await decryptMnemonic(phrase, credentials);
      const decryptedWallets = wallets.map((wallet) => {
        if (wallet.mnemonic) {
          wallet.mnemonic.phrase = decryptedPhrase as string;
        }
        return wallet;
      });
      return MnemonicWalletContainer.create({
        wallets: decryptedWallets,
        credentials,
      });
    }
  }

  private static constructorDeprecated(wallets: BareMnemonicWallet[]) {
    /** Use this method when both seedHash and seedPhraseEncryptionKey_deprecated are unknown */
    const instance = new MnemonicWalletContainer(wallets, '<temp>');
    instance.seedHash = undefined;
    return instance;
  }

  static async restoreWalletContainer(
    walletContainer: SignerContainer,
    credentials: Credentials
  ) {
    const { seedType, seedHash, wallets } = walletContainer;
    invariant(
      seedType === SeedType.mnemonic,
      'Must be a MnemonicWalletContainer'
    );
    assertMnemonicWallets(wallets);
    if (seedHash) {
      return new MnemonicWalletContainer(wallets, seedHash);
    } else if (isSessionCredentials(credentials)) {
      return await MnemonicWalletContainer.restoreFromDeprecated({
        wallets,
        credentials,
      });
    } else {
      return MnemonicWalletContainer.constructorDeprecated(wallets);
    }
  }

  static async decryptMnemonic(
    phrase: string,
    credentials: SessionCredentials
  ) {
    return decryptMnemonic(phrase, credentials);
  }

  constructor(wallets: BareMnemonicWallet[], seedHash: string) {
    super();
    this.seedHash = seedHash;
    if (!wallets.length) {
      this.wallets = [restoreBareWallet({})];
    } else {
      this.wallets = wallets.map((wallet) => {
        if (!wallet.mnemonic) {
          throw new Error(MISSING_MNEMONIC);
        }
        return restoreBareWallet(wallet);
      });
    }
  }

  addWallet(wallet: BareWallet, seedHash: string) {
    invariant(
      seedHash === this.seedHash,
      'Added wallet must have the same mnemonic as other wallets in the SignerContainer'
    );
    if (this.wallets.some(({ address }) => address === wallet.address)) {
      /** Seems it's better to keep existing wallet in order to save existing state, e.g. name */
      return;
    }
    this.wallets.push(wallet);
  }
}

export class PrivateKeyWalletContainer extends WalletContainerImpl {
  wallets: BareWallet[];
  seedType = SeedType.privateKey;
  seedHash = undefined;

  constructor(wallets: Array<PartiallyRequired<BareWallet, 'privateKey'>>) {
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
      return restoreBareWallet(wallet);
    });
  }

  addWallet() {
    throw new Error('PrivateKeyWalletContainer cannot have multiple wallets');
  }
}

export class TestPrivateKeyWalletContainer extends PrivateKeyWalletContainer {
  wallets: BareWallet[];
  seedType = SeedType.privateKey;
  seedHash = undefined;

  constructor(wallets: BareWallet[]) {
    super(wallets);
    this.wallets = wallets;
  }

  addWallet() {
    throw new Error('PrivateKeyWalletContainer cannot have multiple wallets');
  }
}
