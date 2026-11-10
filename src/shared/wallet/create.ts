import { HDNodeWallet, Wallet as EthersWallet } from 'ethers';
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
import { BLOCKCHAIN_TYPES, type BlockchainType } from './classifiers';
import { assertKnownEcosystems } from './shared';

type AnyEthersWallet = EthersWallet | HDNodeWallet;

function toBareMnemonic(wallet: HDNodeWallet) {
  return wallet.mnemonic && wallet.path
    ? { phrase: wallet.mnemonic.phrase, path: wallet.path }
    : null;
}

function isAnyEthersWallet(wallet: AnyEthersWallet | BareWallet): wallet is AnyEthersWallet {
  return wallet instanceof EthersWallet || wallet instanceof HDNodeWallet;
}

export function walletToObject(wallet: AnyEthersWallet | BareWallet): BareWallet {
  if (isAnyEthersWallet(wallet)) {
    return {
      mnemonic: wallet instanceof HDNodeWallet ? toBareMnemonic(wallet) : null,
      privateKey: wallet.privateKey,
      address: wallet.address,
      name: null,
    };
  }
  return wallet;
}

function fromPrivateKey(privateKey: string) {
  return new EthersWallet(privateKey);
}

function fromEthersWallet(wallet: HDNodeWallet): BareMnemonicWallet;
function fromEthersWallet(wallet: EthersWallet): BareWallet;
function fromEthersWallet(wallet: AnyEthersWallet): BareWallet | BareMnemonicWallet {
  return {
    mnemonic: wallet instanceof HDNodeWallet ? toBareMnemonic(wallet) : null,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: null,
  };
}

export async function restoreBareWallet(
  wallet: Partial<BareWallet>,
): Promise<BareWallet | BareMnemonicWallet> {
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
      const keypair = await fromSecretKeyToEd25519(privateKey);
      return fromSolanaKeypair({ keypair, mnemonic: null });
    } else {
      return fromEthersWallet(fromPrivateKey(privateKey));
    }
  } else if (mnemonic) {
    if (isSolanaPath(mnemonic.path)) {
      const keypair = await fromMnemonicToEd25519(mnemonic.phrase, mnemonic.path);
      return fromSolanaKeypair({ mnemonic, keypair });
    } else {
      const wallet = HDNodeWallet.fromPhrase(mnemonic.phrase, undefined, mnemonic.path);
      return fromEthersWallet(wallet);
    }
  } else {
    return fromEthersWallet(EthersWallet.createRandom());
  }
}

async function seedToSolanaWallet(phrase: string): Promise<BareMnemonicWallet> {
  const mnemonic = {
    phrase,
    path: getAccountPath('solanaBip44Change', 0),
  };
  const keypair = await fromMnemonicToEd25519(mnemonic.phrase, mnemonic.path);
  return fromSolanaKeypair({ mnemonic, keypair });
}

export async function generateWalletsForEcosystems(
  ecosystems: BlockchainType[],
): Promise<BareMnemonicWallet[]> {
  invariant(ecosystems.length > 0, 'Must provide at least one ecosystem');
  assertKnownEcosystems(ecosystems);
  const seedWallet = EthersWallet.createRandom();
  const result: BareMnemonicWallet[] = [];

  const toPriority = (value: BlockchainType) => BLOCKCHAIN_TYPES.indexOf(value);
  const sorted = sortBy(ecosystems, toPriority); // priority sorting

  for (const ecosystem of sorted) {
    if (ecosystem === 'evm') {
      result.push(fromEthersWallet(seedWallet));
    } else if (ecosystem === 'solana') {
      invariant(seedWallet.mnemonic, 'Seed wallet must have a mnemonic');
      result.push(await seedToSolanaWallet(seedWallet.mnemonic.phrase));
    }
  }
  return result;
}
