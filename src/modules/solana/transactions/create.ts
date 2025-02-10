import type { VersionedTransaction } from '@solana/web3.js';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
} from 'src/modules/crypto/convert';
import { SolTransaction } from 'src/modules/solana/SolTransaction';

export function solFromBase64(base64: string): SolTransaction {
  const typedArray = base64ToUint8Array(base64);
  return SolTransaction.from(typedArray);
}

export function solToBase64(
  transaction: SolTransaction | VersionedTransaction
): string {
  const serialized = transaction.serialize({ requireAllSignatures: false });
  return uint8ArrayToBase64(serialized);
}
