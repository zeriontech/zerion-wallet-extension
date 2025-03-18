import { Wallet as EthersV5Wallet } from '@ethersproject/wallet';
import sortBy from 'lodash/sortBy';
import {
  fromMnemonicToEd25519,
  fromSecretKeyToEd25519,
  fromSolanaKeypair,
} from 'src/modules/solana/keypairs';
import { isSolanaPrivateKey } from 'src/modules/solana/shared';
import type { BareMnemonicWallet } from 'src/background/Wallet/model/BareWallet';
import type { BareWallet } from '../types/BareWallet';
import { invariant } from '../invariant';
import { getAccountPath, isSolanaPath } from './derivation-paths';

export function walletToObject(
  wallet: EthersV5Wallet | BareWallet
): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: wallet instanceof EthersV5Wallet ? null : wallet.name,
  };
}

type PrivateKeyWallet = Omit<EthersV5Wallet, 'mnemonic'> & {
  mnemonic: EthersV5Wallet['mnemonic'] | null;
};

/** Fixes wrong type where in EthersV5Wallet is never null */
function fromPrivateKey(privateKey: string) {
  return new EthersV5Wallet(privateKey) as PrivateKeyWallet;
}

function fromEthersWallet(wallet: EthersV5Wallet): BareMnemonicWallet;
function fromEthersWallet(wallet: PrivateKeyWallet): BareWallet;
function fromEthersWallet(
  wallet: EthersV5Wallet | PrivateKeyWallet
): BareWallet | BareMnemonicWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: null,
  };
}

export function restoreBareWallet(
  wallet: Partial<BareWallet>
): BareWallet | BareMnemonicWallet {
  const { address, privateKey, mnemonic, name } = wallet;
  if (address && privateKey) {
    return {
      privateKey,
      address,
      mnemonic: mnemonic || null,
      name: name || null,
    };
  } else if (privateKey) {
    if (isSolanaPrivateKey(privateKey)) {
      const keypair = fromSecretKeyToEd25519(privateKey);
      return fromSolanaKeypair({ keypair, mnemonic: null });
    } else {
      return fromEthersWallet(fromPrivateKey(privateKey));
    }
  } else if (mnemonic) {
    if (isSolanaPath(mnemonic.path)) {
      const keypair = fromMnemonicToEd25519(mnemonic.phrase, mnemonic.path);
      return fromSolanaKeypair({ mnemonic, keypair });
    } else {
      const wallet = EthersV5Wallet.fromMnemonic(
        mnemonic.phrase,
        mnemonic.path
      );
      return fromEthersWallet(wallet);
    }
  } else {
    return fromEthersWallet(EthersV5Wallet.createRandom());
  }
}

function assertKnownEcosystems(
  set: Set<string>
): asserts set is Set<'evm' | 'solana'> {
  const arr = Array.from(set);
  invariant(
    arr.every((value) => value === 'evm' || value === 'solana'),
    `Unknown ecosystem parameter: ${arr}`
  );
}

function seedToSolanaWallet(phrase: string): BareMnemonicWallet {
  const mnemonic = {
    phrase,
    path: getAccountPath('solanaBip44Change', 0),
  };
  const keypair = fromMnemonicToEd25519(mnemonic.phrase, mnemonic.path);
  return fromSolanaKeypair({ mnemonic, keypair });
}

export function generateWalletsForEcosystems(
  ecosystemsSet: Set<'evm' | 'solana' | string>
): BareMnemonicWallet[] {
  invariant(ecosystemsSet.size > 0, 'Must provide at least one ecosystem');
  assertKnownEcosystems(ecosystemsSet);
  const seedWallet = EthersV5Wallet.createRandom();
  const result: BareMnemonicWallet[] = [];

  const toPriority = (value: string) => ['evm', 'solana'].indexOf(value);
  const ecosystems = sortBy(Array.from(ecosystemsSet), toPriority); // priority sorting

  for (const ecosystem of ecosystems) {
    if (ecosystem === 'evm') {
      result.push(fromEthersWallet(seedWallet));
    } else if (ecosystem === 'solana') {
      result.push(seedToSolanaWallet(seedWallet.mnemonic.phrase));
    }
  }
  return result;
}
