import type { Keypair, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { invariant } from 'src/shared/invariant';
import type { SolTransaction } from './SolTransaction';
import { SolanaTransactionLegacy } from './SolTransaction';
import { solToBase64 } from './transactions/create';
import type { SolSignTransactionResult } from './transactions/SolTransactionResponse';

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

export class SolanaSigning {
  static signMessage(
    message: Uint8Array,
    keypair: Keypair
  ): { signature: Uint8Array } {
    const signature = nacl.sign.detached(message, keypair.secretKey);
    return { signature };
  }

  static getTransactionFeePayer(transaction: SolTransaction) {
    const feePayer =
      transaction instanceof SolanaTransactionLegacy
        ? transaction.feePayer?.toBase58()
        : transaction.message.staticAccountKeys.at(0)?.toBase58();
    return feePayer;
  }

  static getTransactionSignature(transaction: SolTransaction): string | null {
    if (transaction instanceof SolanaTransactionLegacy) {
      return getSignatureFromLegacyTransaction(transaction);
    } else {
      return getSignatureFromVersionedTransaction(transaction);
    }
  }

  static signTransaction(
    transaction: SolTransaction,
    keypair: Keypair
  ): SolSignTransactionResult {
    if (transaction instanceof SolanaTransactionLegacy) {
      transaction.partialSign(keypair);
    } else {
      transaction.sign([keypair]);
    }
    const signature = SolanaSigning.getTransactionSignature(transaction);
    invariant(signature, 'Could not resolve signature of a signed tranasction');

    return {
      signature,
      publicKey: keypair.publicKey.toBase58(),
      tx: solToBase64(transaction),
    };
  }

  static signAllTransactions(
    transactions: SolTransaction[],
    keypair: Keypair
  ): SolSignTransactionResult[] {
    const results: SolSignTransactionResult[] = [];
    for (const transaction of transactions) {
      results.push(SolanaSigning.signTransaction(transaction, keypair));
    }
    return results;
  }
}
