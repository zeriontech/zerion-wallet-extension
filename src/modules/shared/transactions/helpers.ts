import type { SolSignTransactionResult } from 'src/modules/solana/transactions/SolTransactionResponse';
import { invariant } from 'src/shared/invariant';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';

export function ensureSolanaResult(
  res: SignTransactionResult
): SolSignTransactionResult {
  invariant(res.solana);
  const solana = Array.isArray(res.solana) ? res.solana.at(0) : res.solana;
  invariant(solana, 'No solana transaction found in result object');
  return solana;
}

export function getTxSender(res: SignTransactionResult): string {
  if (res.evm) {
    return res.evm.from;
  } else if (res.solana) {
    const tx = ensureSolanaResult(res);
    return tx.publicKey;
  } else {
    throw new Error('Unexpected object type');
  }
}
