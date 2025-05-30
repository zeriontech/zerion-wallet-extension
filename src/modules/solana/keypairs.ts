import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as bip39 from 'bip39';
/** TODO: replace with @noble/ed25519 ? */
import { derivePath } from 'ed25519-hd-key';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { BareMnemonicWallet } from 'src/background/Wallet/model/BareWallet';

export function fromSolanaKeypair(opts: {
  mnemonic: null;
  keypair: Keypair;
}): BareWallet;
export function fromSolanaKeypair(opts: {
  mnemonic: { phrase: string; path: string };
  keypair: Keypair;
}): BareMnemonicWallet;
export function fromSolanaKeypair({
  mnemonic,
  keypair,
}: {
  mnemonic: null | { phrase: string; path: string };
  keypair: Keypair;
}): BareWallet | BareMnemonicWallet {
  return {
    mnemonic,
    address: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
    name: null,
  };
}

export function fromMnemonicToEd25519(phrase: string, path: string): Keypair {
  const seed = bip39.mnemonicToSeedSync(phrase);
  const { key: derivedSeed } = derivePath(path, seed.toString('hex'));
  return Keypair.fromSeed(derivedSeed);
}

export function fromSecretKeyToEd25519(secretKey: string): Keypair {
  return Keypair.fromSecretKey(bs58.decode(secretKey));
}
