export type TransactionPrepareError = {
  /**
   * @description Error code with the following cases:
   *     1 - Not enough input asset balance
   *     2 - Not enough base (gas) asset balance
   *     5 - Token can't be transferred
   *     Other codes may be added later.
   */
  code: number;
  /** @description Detailed error message, should be used only if client cannot handle the error */
  message: string;
  /**
   * @description Possible ways to resolve the error:
   *     0 - No action
   *     1 - Top up the wallet
   *     Other hints may be added later.
   */
  hint: number | null;
};
