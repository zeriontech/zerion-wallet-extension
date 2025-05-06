import { VersionedTransaction, Transaction } from '@solana/web3.js';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
} from 'src/modules/crypto/convert';
import type { SolTransaction } from 'src/modules/solana/SolTransaction';

export function solFromBase64(base64: string): SolTransaction {
  const typedArray = base64ToUint8Array(base64);
  try {
    return Transaction.from(typedArray);
  } catch {
    return VersionedTransaction.deserialize(typedArray);
  }
}

export function solToBase64(
  transaction: SolTransaction | VersionedTransaction,
  { requireAllSignatures } = { requireAllSignatures: false }
): string {
  const serialized = transaction.serialize({ requireAllSignatures });
  return uint8ArrayToBase64(serialized);
}
