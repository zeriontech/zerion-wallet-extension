import type { StringBase64 } from 'src/shared/types/StringBase64';

interface SignResult {
  signature: string;
  publicKey: string;
  tx: StringBase64;
}

export type SolSignTransactionResult = SignResult;
