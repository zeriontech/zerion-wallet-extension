interface SignResult {
  signature: string | null;
  publicKey: string;
  tx: string;
}

export type SolSignTransactionResult = SignResult;
