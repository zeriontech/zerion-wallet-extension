import type { Keypair, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import type { SolTransaction } from './SolTransaction';
import { SolanaTransactionLegacy } from './SolTransaction';
import { solToBase64 } from './transactions/create';
import type { SolTransactionResponse } from './transactions/SolTransactionResponse';

export function solanaSignMessage(
  message: Uint8Array,
  keypair: Keypair
): { signature: Uint8Array } {
  const signature = nacl.sign.detached(message, keypair.secretKey);
  return { signature };
}

export function getTransactionFeePayer(transaction: SolTransaction) {
  const feePayer =
    transaction instanceof SolanaTransactionLegacy
      ? transaction.feePayer?.toBase58()
      : transaction.message.staticAccountKeys.at(0)?.toBase58();
  return feePayer;
}

function getSignatureFromLegacyTransaction(
  transaction: SolanaTransactionLegacy
): string | null {
  const first = transaction.signatures.at(0);
  if (first?.signature) {
    return bs58.encode(first.signature);
  }
  return null;
}

function getSignatureFromVersionedTransaction(
  transaction: VersionedTransaction
): string | null {
  if (transaction.signatures.length > 0) {
    return bs58.encode(transaction.signatures[0]);
  }
  return null;
}

export function getTransactionSignature(
  transaction: SolTransaction
): string | null {
  if (transaction instanceof SolanaTransactionLegacy) {
    return getSignatureFromLegacyTransaction(transaction);
  } else {
    return getSignatureFromVersionedTransaction(transaction);
  }
}

export function solanaSignTransaction(
  transaction: SolTransaction,
  keypair: Keypair
): SolTransactionResponse {
  if (transaction instanceof SolanaTransactionLegacy) {
    transaction.partialSign(keypair);
  } else {
    transaction.sign([keypair]);
  }
  return {
    signature: getTransactionSignature(transaction),
    publicKey: keypair.publicKey.toBase58(),
    tx: solToBase64(transaction),
  };
}

export function solanaSignAllTransactions(
  transactions: SolTransaction[],
  keypair: Keypair
): SolTransactionResponse[] {
  const results: SolTransactionResponse[] = [];
  for (const transaction of transactions) {
    results.push(solanaSignTransaction(transaction, keypair));
  }
  return results;
}
