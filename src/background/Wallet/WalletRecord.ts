import { encrypt } from '@metamask/browser-passworder';
import { ethers } from 'ethers';
import produce from 'immer';

type Origin = string;
type Address = string;

export interface BareWallet {
  mnemonic: { phrase: string; path?: string; locale?: string } | null;
  privateKey: ethers.Wallet['privateKey'];
  publicKey: ethers.Wallet['publicKey'];
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

export interface WalletContainer {
  seedType: SeedType;
  wallet: ethers.Wallet;
}

export class MnemonicWalletContainer implements WalletContainer {
  wallet: ethers.Wallet;
  seedType = SeedType.mnemonic;

  constructor(wallet: Pick<BareWallet, 'mnemonic'>) {
    if (!wallet.mnemonic) {
      throw new Error(
        'Mnemonic container is expected to have a wallet with a mnemonic'
      );
    }
    this.wallet = ethers.Wallet.fromMnemonic(
      wallet.mnemonic.phrase,
      wallet.mnemonic.path
    );
  }
}

export class PrivateKeyWalletContainer implements WalletContainer {
  wallet: ethers.Wallet;
  seedType = SeedType.privateKey;

  constructor(wallet: Pick<BareWallet, 'privateKey'>) {
    if (!wallet.privateKey) {
      throw new Error(
        'PrivateKey container is expected to have a wallet with a privateKey'
      );
    }
    this.wallet = new ethers.Wallet(wallet.privateKey);
  }
}

export interface WalletRecord<
  T extends WalletContainer | BareWalletContainer | null
> {
  walletContainer: T;
  permissions: Record<Origin, Address>;
  transactions: ethers.providers.TransactionResponse[];
}

export function createRecord({
  walletContainer,
}: {
  walletContainer: WalletContainer;
}): WalletRecord<WalletContainer> {
  return {
    walletContainer,
    permissions: {},
    transactions: [],
  };
}

function walletToObject(wallet: ethers.Wallet | BareWallet): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    address: wallet.address,
  };
}

function toPlainObject(record: WalletRecord<BareWalletContainer>) {
  return produce(record, (draft) => {
    const { wallet } = draft.walletContainer;
    draft.walletContainer.wallet = walletToObject(wallet);
  });
}

export async function encryptRecord(
  key: string,
  record: WalletRecord<WalletContainer>
) {
  return encrypt(key, toPlainObject(record));
}
