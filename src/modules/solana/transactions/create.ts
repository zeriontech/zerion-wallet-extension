import { VersionedTransaction, Transaction } from '@solana/web3.js';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
} from 'src/modules/crypto/convert';
import type { SolTransaction } from 'src/modules/solana/SolTransaction';
import type { StringBase64 } from 'src/shared/types/StringBase64';

export function solFromBase64(base64: StringBase64): SolTransaction {
  const typedArray = base64ToUint8Array(base64);
  try {
    return Transaction.from(typedArray);
  } catch {
    return VersionedTransaction.deserialize(typedArray);
  }
}

export function solToBase64(
  transaction: SolTransaction,
  { requireAllSignatures } = { requireAllSignatures: false }
): StringBase64 {
  const serialized = transaction.serialize({ requireAllSignatures });
  return uint8ArrayToBase64(serialized) as StringBase64;
}
