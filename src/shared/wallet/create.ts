import { Wallet as EthersV5Wallet } from '@ethersproject/wallet';
import {
  fromMnemonicToEd25519,
  fromSecretKeyToEd25519,
  fromSolanaKeypair,
} from 'src/modules/solana/keypairs';
import { isSolanaPrivateKey } from 'src/modules/solana/shared';
import type { BareWallet } from '../types/BareWallet';
import { isSolanaPath } from './derivation-paths';

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

export function fromEthersWallet(wallet: EthersV5Wallet): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: null,
  };
}

export function restoreBareWallet(wallet: Partial<BareWallet>): BareWallet {
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
      return fromEthersWallet(new EthersV5Wallet(privateKey));
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
