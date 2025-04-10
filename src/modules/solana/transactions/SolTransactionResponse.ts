interface SignAndSendResult {
  /** string value implies tx has been submitted to the node */
  signature: string;
  publicKey: string;
  tx: string;
}
interface SignResult {
  /** null implies the tx is signed, but has not been submitted */
  signature: null;
  publicKey: string;
  tx: string;
}

export type SolTransactionResponse = SignAndSendResult | SignResult;
