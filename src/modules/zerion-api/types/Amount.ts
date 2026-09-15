export type Amount = {
  currency: string;
  /** @description Amount in common units (like token units) */
  quantity: string;
  /** @description Amount in fiat units */
  value: number | null;
  /** @description Amount in USD */
  usdValue: number | null;
  /**
   * @description Confidential (e.g. Zama FHE) amount: encrypted on-chain and
   * returned zeroed until a matching Signed Permit is attached to the request
   */
  encrypted?: boolean;
};
