import { ethers } from 'ethers';
import sortBy from 'lodash/sortBy';
import {
  fromMnemonicToEd25519,
  fromSecretKeyToEd25519,
  fromSolanaKeypair,
} from 'src/modules/solana/keypairs';
import { isSolanaPrivateKey } from 'src/modules/solana/shared';
import { hasOnlySpaceSeparators } from 'src/shared/validation/wallet';
import type { BareMnemonicWallet } from 'src/background/Wallet/model/BareWallet';
import type { BareWallet } from '../types/BareWallet';
import { invariant } from '../invariant';
import { getAccountPath, isSolanaPath } from './derivation-paths';
import { BLOCKCHAIN_TYPES, type BlockchainType } from './classifiers';
import { assertKnownEcosystems } from './shared';

export function walletToObject(wallet: BareWallet): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: wallet.name,
  };
}

function fromPrivateKey(privateKey: string): BareWallet {
  const wallet = new ethers.Wallet(privateKey);
  return { mnemonic: null, privateKey: wallet.privateKey, address: wallet.address, name: null };
}

function fromHDNodeWallet(wallet: ethers.HDNodeWallet): BareMnemonicWallet {
  invariant(wallet.mnemonic, 'Expected a wallet created from a recovery phrase');
  invariant(wallet.path, 'Expected a wallet with a derivation path');
  return {
    mnemonic: { phrase: wallet.mnemonic.phrase, path: wallet.path },
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: null,
  };
}

export function restoreBareWallet(wallet: Partial<BareWallet>): BareWallet | BareMnemonicWallet {
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
      return fromPrivateKey(privateKey);
    }
  } else if (mnemonic) {
    if (isSolanaPath(mnemonic.path)) {
      const keypair = fromMnemonicToEd25519(mnemonic.phrase, mnemonic.path);
      return fromSolanaKeypair({ mnemonic, keypair });
    } else {
      invariant(hasOnlySpaceSeparators(mnemonic.phrase), 'Expected space-separated words');
      return fromHDNodeWallet(
        ethers.HDNodeWallet.fromPhrase(mnemonic.phrase, undefined, mnemonic.path),
      );
    }
  } else {
    return fromHDNodeWallet(ethers.Wallet.createRandom());
  }
}

function seedToSolanaWallet(phrase: string): BareMnemonicWallet {
  const mnemonic = {
    phrase,
    path: getAccountPath('solanaBip44Change', 0),
  };
  const keypair = fromMnemonicToEd25519(mnemonic.phrase, mnemonic.path);
  return fromSolanaKeypair({ mnemonic, keypair });
}

export function generateWalletsForEcosystems(ecosystems: BlockchainType[]): BareMnemonicWallet[] {
  invariant(ecosystems.length > 0, 'Must provide at least one ecosystem');
  assertKnownEcosystems(ecosystems);
  const seedWallet = fromHDNodeWallet(ethers.Wallet.createRandom());
  const result: BareMnemonicWallet[] = [];

  const toPriority = (value: BlockchainType) => BLOCKCHAIN_TYPES.indexOf(value);
  const sorted = sortBy(ecosystems, toPriority); // priority sorting

  for (const ecosystem of sorted) {
    if (ecosystem === 'evm') {
      result.push(seedWallet);
    } else if (ecosystem === 'solana') {
      result.push(seedToSolanaWallet(seedWallet.mnemonic.phrase));
    }
  }
  return result;
}
