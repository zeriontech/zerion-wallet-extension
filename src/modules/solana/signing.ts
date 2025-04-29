import type { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

export function solanaSignMessage(
  message: Uint8Array,
  keypair: Keypair
): { signature: Uint8Array } {
  const signature = nacl.sign.detached(message, keypair.secretKey);
  return { signature };
}
