import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as bip39 from 'bip39';
/** TODO: replace with @noble/ed25519 ? */
import { derivePath } from 'ed25519-hd-key';
import type { BareWallet } from '../types/BareWallet';

export function fromSolanaKeypair({
  mnemonic,
  keypair,
}: {
  mnemonic: null | { phrase: string; path: string };
  keypair: Keypair;
}): BareWallet {
  return {
    mnemonic,
    address: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
    name: null,
  };
}

export const isSolanaAddress = (s: string) => !s.startsWith('0x');

export function fromMnemonicToEd25519(phrase: string, path: string): Keypair {
  const seed = bip39.mnemonicToSeedSync(phrase);
  const { key: derivedSeed } = derivePath(path, seed.toString('hex'));
  return Keypair.fromSeed(derivedSeed);
}

export function fromSecretKeyToEd25519(secretKey: string): Keypair {
  return Keypair.fromSecretKey(bs58.decode(secretKey));
}
