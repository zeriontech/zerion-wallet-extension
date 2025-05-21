import type { Asset } from 'defi-sdk';

export interface NetworkFeeType {
  free: boolean;
  amount: {
    /** @description Amount in common units (like token units) */
    quantity: string;
    /** @description Amount in fiat units */
    value: number | null;
    usdValue: null;
  };
  fungible: null | Asset; // TODO: Change to Asset type from zpi (camelCased properties)
}
