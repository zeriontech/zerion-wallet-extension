import { decrypt, encrypt } from '@metamask/browser-passworder';
import { ethers } from 'ethers';
import produce from 'immer';
import { nanoid } from 'nanoid';

type Origin = string;
type Address = string;

export interface BareWallet {
  mnemonic: { phrase: string; path: string } | null;
  privateKey: ethers.Wallet['privateKey'];
  address: ethers.Wallet['address'];
}

export enum SeedType {
  privateKey,
  mnemonic,
}

export interface BareWalletContainer {
  seedType: SeedType;
  wallet: BareWallet;
}

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
  toPlainObject(): PlainWalletContainer;
  getWalletByAddress(address: string): BareWallet | null;
}

function walletToObject(wallet: ethers.Wallet | BareWallet): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

abstract class WalletContainerImpl implements WalletContainer {
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

  addWallet(wallet: ethers.Wallet) {
    this.wallets.push(wallet);
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

export function getWalletByAddress(record: WalletRecord, address: string) {
  for (const group of record.walletManager.groups) {
    const wallet = group.walletContainer.getWalletByAddress(address);
    if (wallet) {
      return wallet;
    }
  }
  return null;
}

function fromEthersWallet(wallet: ethers.Wallet): BareWallet {
  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
    mnemonic: wallet.mnemonic,
  };
}

export function toEthersWallet(wallet: BareWallet): ethers.Wallet {
  const { mnemonic, privateKey } = wallet;
  if (mnemonic) {
    return ethers.Wallet.fromMnemonic(mnemonic.phrase, mnemonic.path);
  } else {
    return new ethers.Wallet(privateKey);
  }
}

function restoreBareWallet(wallet: Partial<BareWallet>): BareWallet {
  const { address, privateKey, mnemonic } = wallet;
  if (address && privateKey) {
    return {
      privateKey,
      address,
      mnemonic: mnemonic || null,
    };
  } else if (privateKey) {
    return fromEthersWallet(new ethers.Wallet(privateKey));
  } else if (mnemonic) {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic.phrase, mnemonic.path);
    return fromEthersWallet(wallet);
  } else {
    return fromEthersWallet(ethers.Wallet.createRandom());
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
  wallets: ethers.Wallet[];
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
      return new ethers.Wallet(wallet.privateKey);
    });
  }

  addWallet(_wallet: ethers.Wallet) {
    throw new Error('PrivateKeyWalletContainer cannot have multiple wallets');
  }
}

export interface WalletGroup {
  id: string;
  walletContainer: WalletContainer;
  name: string;
  lastBackedUp: number | null;
}

interface WalletManager {
  groups: WalletGroup[];
  currentAddress: string | null;
}

export interface WalletRecord {
  walletManager: WalletManager;
  permissions: Record<Origin, Address>;
  transactions: ethers.providers.TransactionResponse[];
}

export interface PendingWallet {
  walletContainer: WalletContainer;
  groupId: string | null;
}

function generateGroupName(
  record: WalletRecord | null,
  walletContainer: WalletContainer
) {
  if (walletContainer.seedType === SeedType.privateKey) {
    return '';
  }
  const name = (index: number) => `Wallet Group ${index}`;
  if (!record) {
    return name(1);
  }
  const mnemonicGroups = record.walletManager.groups.filter(
    (group) => group.walletContainer.seedType === SeedType.mnemonic
  );
  function isNameUsed(name: string) {
    const index = mnemonicGroups.findIndex((group) => group.name === name);
    return index !== -1;
  }
  let potentialName = name(mnemonicGroups.length + 1);
  while (isNameUsed(potentialName)) {
    potentialName = `${potentialName} (2)`;
  }
  return potentialName;
}

function createGroup({
  name,
  walletContainer,
}: {
  walletContainer: WalletContainer;
  name: string;
}): WalletGroup {
  return {
    id: nanoid(),
    walletContainer,
    lastBackedUp: null,
    name,
  };
}

export function createOrUpdateRecord(
  record: WalletRecord | null,
  pendingWallet: PendingWallet
): WalletRecord {
  if (!record) {
    return {
      walletManager: {
        groups: [
          createGroup({
            name: generateGroupName(record, pendingWallet.walletContainer),
            walletContainer: pendingWallet.walletContainer,
          }),
        ],
        currentAddress: pendingWallet.walletContainer.getFirstWallet().address,
      },
      transactions: [],
      permissions: {},
    };
  }
  return produce(record, (draft) => {
    const { walletContainer } = pendingWallet;
    const { seedType } = walletContainer;
    if (seedType === SeedType.privateKey) {
      const { privateKey } = walletContainer.getFirstWallet();
      const existingGroup = draft.walletManager.groups.find(
        (group) =>
          group.walletContainer.getFirstWallet().privateKey === privateKey
      );
      if (existingGroup) {
        return draft; // NOTE: private key already exists, should we update record or keep untouched?
      } else {
        draft.walletManager.groups.push(
          createGroup({
            walletContainer,
            name: generateGroupName(record, walletContainer),
          })
        );
      }
    } else if (seedType === SeedType.mnemonic) {
      /** Is mnemonic */
      const mnemonic = walletContainer.getMnemonic();
      if (!mnemonic) {
        throw new Error('Mnemonic not found');
      }
      const existingGroup = draft.walletManager.groups.find(
        (group) =>
          group.walletContainer.getMnemonic()?.phrase === mnemonic.phrase
      );
      if (existingGroup) {
        walletContainer.wallets.forEach((wallet) => {
          existingGroup.walletContainer.addWallet(wallet);
        });
      } else {
        draft.walletManager.groups.push(
          createGroup({
            walletContainer,
            name: generateGroupName(record, walletContainer),
          })
        );
      }
    } else {
      throw new Error('Unknown SeedType');
    }
  });
}

function toPlainObject(record: WalletRecord) {
  return produce(record, (draft) => {
    // @ts-ignore
    draft.walletManager.groups = draft.walletManager.groups.map((group) => ({
      ...group,
      walletContainer: group.walletContainer.toPlainObject(),
    }));
  });
}

export async function encryptRecord(key: string, record: WalletRecord) {
  return encrypt(key, toPlainObject(record));
}

export async function decryptRecord(key: string, encryptedRecord: string) {
  const data = (await decrypt(key, encryptedRecord)) as WalletRecord;
  data.walletManager.groups = data.walletManager.groups.map((group) => {
    const { seedType, wallets } = group.walletContainer;
    if (seedType === SeedType.mnemonic) {
      group.walletContainer = new MnemonicWalletContainer(wallets);
    } else if (seedType === SeedType.privateKey) {
      group.walletContainer = new PrivateKeyWalletContainer(wallets);
    } else {
      throw new Error(`Unexpected SeedType: ${seedType}`);
    }

    return group;
  });
  return data as WalletRecord;
}
