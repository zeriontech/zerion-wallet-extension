import type { Keypair, VersionedTransaction } from '@solana/web3.js';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import bs58 from 'bs58';
import { invariant } from 'src/shared/invariant';
import type { SolTransaction } from './SolTransaction';
import { SolanaTransactionLegacy } from './SolTransaction';
import { solToBase64 } from './transactions/create';
import type { SolSignTransactionResult } from './transactions/SolTransactionResponse';

ed.hashes.sha512 = sha512;

function getSignatureFromLegacyTransaction(transaction: SolanaTransactionLegacy): string | null {
  const first = transaction.signatures.at(0);
  if (first?.signature) {
    return bs58.encode(first.signature);
  }
  return null;
}

function getSignatureFromVersionedTransaction(transaction: VersionedTransaction): string | null {
  if (transaction.signatures.length > 0) {
    return bs58.encode(transaction.signatures[0]);
  }
  return null;
}

export class SolanaSigning {
  static signMessage(message: Uint8Array, keypair: Keypair): { signature: Uint8Array } {
    // Solana secret keys are seed || public key; noble signs with the 32-byte seed.
    const signature = ed.sign(message, keypair.secretKey.subarray(0, 32));
    return { signature };
  }

  static getTransactionSignature(transaction: SolTransaction): string | null {
    if (transaction instanceof SolanaTransactionLegacy) {
      return getSignatureFromLegacyTransaction(transaction);
    } else {
      return getSignatureFromVersionedTransaction(transaction);
    }
  }

  static async signTransaction(
    transaction: SolTransaction,
    keypair: Keypair,
  ): Promise<SolSignTransactionResult> {
    if (transaction instanceof SolanaTransactionLegacy) {
      await transaction.sign(keypair);
    } else {
      await transaction.sign([keypair]);
    }
    const signature = SolanaSigning.getTransactionSignature(transaction);
    invariant(signature, 'Could not resolve signature of a signed tranasction');

    return {
      signature,
      publicKey: keypair.publicKey.toBase58(),
      tx: await solToBase64(transaction),
    };
  }

  static async signAllTransactions(
    transactions: SolTransaction[],
    keypair: Keypair,
  ): Promise<SolSignTransactionResult[]> {
    const results: SolSignTransactionResult[] = [];
    for (const transaction of transactions) {
      results.push(await SolanaSigning.signTransaction(transaction, keypair));
    }
    return results;
  }
}
