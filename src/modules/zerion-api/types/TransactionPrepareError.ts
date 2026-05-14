export type TransactionPrepareError = {
  /**
   * @description Error code with the following cases:
   *     1 - Not enough input asset balance
   *     2 - Not enough base (gas) asset balance
   */
  code: 1 | 2;
  /** @description Detailed error message, should be used only if client cannot handle the error */
  message: string;
  /**
   * @description Possible ways to resolve the error:
   *     1 - Top up the wallet
   */
  hint: 1 | null;
};
