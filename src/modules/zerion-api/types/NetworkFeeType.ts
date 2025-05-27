import type { Fungible } from './Fungible';

export interface NetworkFeeType {
  free: boolean;
  amount: {
    /** @description Amount in common units (like token units) */
    quantity: string;
    /** @description Amount in fiat units */
    value: number | null;
    usdValue: number | null;
  };
  fungible: null | Fungible;
}
